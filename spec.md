# FamilyFrame — Spécifications

## Objectif

Envoyer une photo depuis un navigateur
et l'afficher sur un autre écran en temps réel.

## Parcours utilisateur

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
                                     → io.emit('photo:new') ─────────► affichage instantané
                          GET /api/photos ◄────────────────────────── chargement initial
```

## API

| Méthode | Route | Entrée | Sortie |
|---|---|---|---|
| POST | `/api/photos` | multipart : `photo` (fichier), `pseudo` (texte) | `201` + photo créée |
| GET | `/api/photos?limit=N` | — | photos, plus récente en premier |
| DELETE | `/api/photos/:id` | — | `204` (base puis Cloudinary), `404` si inconnue |

Événements Socket.IO (serveur → clients) : `photo:new` avec la photo créée, `photo:deleted` avec l'identifiant supprimé.

Suppression ouverte à tout visiteur (pas d'authentification dans le POC), bouton masqué en mode `?cadre`.

Erreurs : JSON `{ error }` — `400` (pseudo ou fichier manquant/invalide), `413` (trop lourd), `415` (format refusé), `500`.

## Données (MongoDB, via Prisma 6)

```prisma
model Photo {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  url       String
  publicId  String   @unique
  pseudo    String
  createdAt DateTime @default(now())
  @@index([createdAt(sort: Desc)])
}
```

## Configuration (`backend/.env`)

- `DATABASE_URL` : chaîne Atlas `mongodb+srv://…/familyframe?…` (nom de base obligatoire)
- `CLOUDINARY_URL` : `cloudinary://<api_key>:<api_secret>@<cloud_name>`
- `PORT` : port du backend (3000)

## Contraintes

- Images traitées avec Multer et Sharp.
- Stockage des images sur Cloudinary.
- Métadonnées enregistrées dans MongoDB : URL, identifiant Cloudinary, pseudo, date.
- Communication temps réel avec Socket.IO, sans rechargement.
- Dernière photo prioritaire.
- Anciennes photos récupérables (`GET /api/photos`).
- Accessible depuis un smartphone sur le réseau local (Vite `server.host: true`).

## Hors périmètre du POC

- Authentification
- Gestion de plusieurs familles
- Galerie avancée (J5)
- Rate limiting
- Docker et CI (prévus après le POC)
