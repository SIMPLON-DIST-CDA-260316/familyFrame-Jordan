# FamilyFrame

Cadre photo connecté (MVP) : un proche envoie une photo depuis son smartphone, elle apparaît aussitôt sur le cadre, sans rechargement.

**Stack** : pnpm · React + Vite · Express 5 · Socket.IO · MongoDB Atlas + Prisma 6 · Multer + Sharp · Cloudinary · TypeScript (exécuté directement par Node, sans build côté backend).

## Parcours d'une photo

```
Smartphone (/ › Envoyer)    Backend Express :3000                      Cadre (/?cadre)
pseudo + photo ──POST /api/photos──► Multer   : mémoire, 10 Mo max, 1 fichier
                                     Sharp    : vérifie le vrai format, décode puis réencode en JPEG
                                                (redressée, 1920 px max, métadonnées/GPS supprimés)
                                     Cloudinary : hébergement de l'image
                                     Prisma   : url, publicId, pseudo, date → MongoDB Atlas
                                     Socket.IO : io.emit('photo:new') ──────────► affichage instantané
                            GET /api/photos ◄───────────────────────────────────── dernière photo au (re)chargement
```

L'accueil est un mur de Polaroids : la dernière photo au premier plan, les 12 précédentes en décor (cliquer pour agrandir). Animations en CSS, désactivées si le système demande moins d'animations.

En local, Vite (port 5173) sert le frontend et redirige `/api` et `/socket.io` vers le backend : le navigateur ne voit qu'une seule origine.

## Prérequis

- **Node.js 26** ou plus récent (exécute le TypeScript nativement)
- **pnpm 12** : https://pnpm.io/installation (la version exacte est fixée par `packageManager` dans `package.json`)
- Un compte **MongoDB Atlas** (cluster gratuit M0) et un compte **Cloudinary** (gratuit)

## Configuration des services

### Cloudinary
1. Créer un compte, puis ouvrir **Settings › API Keys** dans la console.
2. Copier l'**API environment variable** : `cloudinary://<api_key>:<api_secret>@<cloud_name>` (remplacer les marqueurs par la vraie clé et le vrai secret).

### MongoDB Atlas
1. Créer un cluster **Free (M0)**, sans données d'exemple.
2. **Security › Database Access** : créer un utilisateur (mot de passe) avec le rôle `readWrite` sur la base `familyframe`.
3. **Security › Network Access** : ajouter son adresse IP (à refaire si on change de réseau).
4. **Clusters › Connect › Drivers** : copier la chaîne `mongodb+srv://…`, y mettre l'utilisateur et le mot de passe, puis **ajouter le nom de la base `familyframe` entre le `/` et le `?`**.

## Démarrage

```bash
pnpm install                              # installe tout et génère le client Prisma
cp backend/.env.example backend/.env      # puis renseigner DATABASE_URL et CLOUDINARY_URL
pnpm --filter backend db:push             # crée la collection Photo et son index dans Atlas
pnpm dev                                  # lance le backend (:3000) et le frontend (:5173)
```

| Page | URL |
|---|---|
| Mur de photos + bouton « Envoyer une photo » | http://localhost:5173/ |
| Cadre numérique (sans bouton ni curseur) | http://localhost:5173/?cadre (plein écran : F11) |
| Depuis un smartphone (même Wi-Fi) | l'adresse **Network** affichée par Vite, ex. `http://192.168.1.x:5173/` |

`backend/.env` contient des secrets : il est ignoré par git et ne doit jamais être commité.

## Commandes utiles

| Commande | Rôle |
|---|---|
| `pnpm dev` | backend + frontend en mode développement (rechargement automatique) |
| `pnpm typecheck` | vérification TypeScript des deux paquets |
| `pnpm test` | tests du traitement d'image (backend) et de la fusion des photos du mur (frontend) |
| `pnpm --filter backend db:push` | synchronise le schéma Prisma avec MongoDB |
| `pnpm --filter frontend build` | build de production du frontend |

## API

| Méthode | Route | Entrée | Réponse |
|---|---|---|---|
| POST | `/api/photos` | multipart : `pseudo` (1 à 30 caractères) puis `photo` (fichier) | `201` + la photo enregistrée |
| GET | `/api/photos?limit=N` | `N` entier de 1 à 100 (20 par défaut) | photos, la plus récente en premier |
| DELETE | `/api/photos/:id` | identifiant MongoDB (24 caractères hexadécimaux) | `204` (supprimée en base puis sur Cloudinary), `404` si inconnue |

Événements Socket.IO (serveur → clients) : `photo:new` avec la photo enregistrée, `photo:deleted` avec l'identifiant supprimé.

⚠️ Sans authentification (choix du POC), toute personne qui accède à la page peut supprimer une photo. Le bouton n'apparaît pas en mode `?cadre`.
Erreurs : JSON `{ "error": "…" }` avec `400`, `413` (trop lourd), `415` (format refusé) ou `500`.

## Dépannage

| Symptôme | Cause probable |
|---|---|
| Le backend s'arrête : `CLOUDINARY_URL manquante` | `backend/.env` absent ou incomplet |
| `node: .env: not found` au lancement | `backend/.env` n'a pas été créé depuis `.env.example` |
| `500` à l'envoi, `Unknown API key` dans les logs | identifiants Cloudinary incorrects |
| `500` ou `db push` bloqué, erreur de connexion MongoDB | IP absente de la Network Access list d'Atlas, mot de passe ou nom de base manquant dans `DATABASE_URL` |
| `415 Photo HEIC non prise en charge` | fichier HEIC envoyé tel quel : régler l'iPhone sur « Le plus compatible » ou envoyer un JPEG |
| Le téléphone n'accède pas à la page | pas sur le même Wi-Fi, ou pare-feu qui bloque le port 5173 |
| Le cadre affiche « Connexion au serveur en cours… » | backend arrêté : il se reconnecte seul au redémarrage |
