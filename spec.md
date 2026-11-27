# FamilyFrame — Spécifications

## Objectif

Envoyer une photo depuis un navigateur
et l'afficher sur un autre écran en temps réel.

Partie 2 : chaque famille a son propre cadre. Une photo n'est visible que par les membres du cadre auquel elle est envoyée.

## Parcours utilisateur

0. Créer un cadre (nom), ou le rejoindre en scannant son QR code / en saisissant son code d'invitation.
   Sur le mur, la pastille du cadre courant ouvre « Mon cadre » : inviter (QR + code), afficher en mode cadre (`/?cadre`), changer de cadre.
   Mise en place type : le petit-fils crée le cadre sur son téléphone, saisit le code sur la tablette de Mamie puis touche « Afficher en mode cadre ».
1. Saisir un pseudo.
2. Sélectionner ou prendre une photo
   (`<input type="file" accept="image/*" capture>`).
3. Envoyer la photo.
4. Afficher automatiquement la dernière photo
   sur le cadre numérique, avec le pseudo.

## Parcours d'une photo

```
Smartphone (/ › Envoyer)  Backend Express :3000                   Cadre (/?cadre)
pseudo + photo ──POST /api/photos──► Multer (mémoire, 10 Mo, 1 fichier)
                                     → Sharp (contrôle du format, réencodage JPEG)
                                     → Cloudinary (upload_stream)
                                     → Prisma → MongoDB Atlas
                                     → io.to(frameId).emit('photo:new') ► affichage instantané (cadre concerné seulement)
                          GET /api/photos ◄────────────────────────── chargement initial
```

## Cadres et accès

- Un navigateur appartient à un seul cadre : rejoindre un autre cadre remplace la session.
- Session : cookie `HttpOnly`, `SameSite=Lax`, valable 1 an, contenant un JWT HS256 `{ sub: frameId }`.
- Le cadre courant vient toujours du jeton, jamais de l'URL ni du corps de la requête.
- Tout membre du cadre peut envoyer et supprimer les photos de ce cadre.
- Code d'invitation : 10 caractères (alphabet sans 0/O ni 1/I), affiché avec son QR code sur l'écran du cadre (`/?cadre`). Le QR code encode `<origine>/?code=XXXX`.
- Socket.IO : `io.use()` vérifie le cookie à la connexion (refus sans session valide), puis le socket rejoint la room du cadre.

## API

| Méthode | Route | Entrée | Sortie |
|---|---|---|---|
| POST | `/api/frames` | JSON `{ name }` (1 à 50 caractères) | `201` + cadre, cookie de session posé |
| POST | `/api/frames/join` | JSON `{ code }` | `200` + cadre, cookie posé ; `404` si code inconnu |
| GET | `/api/frames/current` | cookie | `{ id, name, inviteCode }` ; `401` sans session valide |
| POST | `/api/photos` | multipart : `photo` (fichier), `pseudo` (texte) | `201` + photo créée |
| GET | `/api/photos?limit=N` | — | photos, plus récente en premier |
| DELETE | `/api/photos/:id` | — | `204` (base puis Cloudinary), `404` si inconnue |

Les routes `/api/photos` exigent une session de cadre (`401` sinon) et ne voient que les photos de ce cadre ; une photo d'un autre cadre répond `404`.

Événements Socket.IO (serveur → clients de la room du cadre) : `photo:new` avec la photo créée, `photo:deleted` avec l'identifiant supprimé.

Suppression ouverte à tout membre du cadre, bouton masqué en mode `?cadre`.

Erreurs : JSON `{ error }` — `400` (pseudo, nom, code ou fichier manquant/invalide), `401` (pas de session), `404` (code ou photo inconnus), `413` (trop lourd), `415` (format refusé), `500`.

## Données (MongoDB, via Prisma 6)

```prisma
model Frame {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  name       String
  inviteCode String   @unique
  createdAt  DateTime @default(now())
  photos     Photo[]
}

model Photo {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  url       String
  publicId  String   @unique
  pseudo    String
  createdAt DateTime @default(now())
  frameId   String   @db.ObjectId
  frame     Frame    @relation(fields: [frameId], references: [id])
  @@index([frameId, createdAt(sort: Desc)])
}
```

Migration des données existantes (`backend/prisma/migrate-frames.ts`, idempotent, lancé par le service `migrate` après `db push`) : les photos sans `frameId` sont rattachées à un cadre « Famille » créé pour l'occasion ; son code d'invitation est affiché dans les logs.

## Configuration (`backend/.env`)

- `DATABASE_URL` : chaîne Atlas `mongodb+srv://…/familyframe?…` (nom de base obligatoire)
- `CLOUDINARY_URL` : `cloudinary://<api_key>:<api_secret>@<cloud_name>`
- `PORT` : port du backend (3000)
- `JWT_SECRET` : secret de signature des sessions (32 octets aléatoires minimum, ex. `openssl rand -base64 32`)

## Contraintes

- Images traitées avec Multer et Sharp.
- Stockage des images sur Cloudinary.
- Métadonnées enregistrées dans MongoDB : URL, identifiant Cloudinary, pseudo, date.
- Communication temps réel avec Socket.IO, sans rechargement.
- Dernière photo prioritaire.
- Anciennes photos récupérables (`GET /api/photos`).
- Accessible depuis un smartphone sur le réseau local (Vite `server.host: true`).

## Hors périmètre

- Comptes utilisateurs et mots de passe
- Plusieurs cadres par navigateur
- Révocation des sessions, régénération du code d'invitation, sortie d'un cadre
- Rate limiting (y compris sur `/api/frames/join`)
- HTTPS (cookie sans drapeau `Secure`, l'application tourne en HTTP sur le réseau local)
