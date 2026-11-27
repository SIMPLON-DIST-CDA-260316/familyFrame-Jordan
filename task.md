# FamilyFrame — Plan de développement

- [ ] T00 — Prérequis (utilisateur) : cluster Atlas M0 (utilisateur, accès réseau, chaîne de connexion avec nom de base) et compte Cloudinary (`CLOUDINARY_URL`)
- [x] T01 — Initialiser frontend et backend
  - workspace pnpm, `.gitignore`, `backend/.env.example`, `tsconfig.json`, scripts `dev` et `typecheck`
  - autoriser les scripts de build pnpm de Prisma (`allowBuilds`) — Sharp utilise des binaires précompilés, rien à autoriser
  - vérifier : `pnpm install` et `pnpm typecheck` passent
- [x] T02 — Créer le formulaire React
  - pseudo + `<input type="file" accept="image/*" capture>`, aperçu, états envoi / succès / erreur, bouton désactivé pendant l'envoi
  - proxy Vite `/api` et `/socket.io`, `server.host: true`
- [x] T03 — Créer l'API Express
  - Express 5 sur `http.Server`, gestionnaire d'erreurs JSON `{ error }`
- [x] T04 — Recevoir et traiter les images
  - Multer (mémoire, 10 Mo, 1 fichier, `image/*`), validation du pseudo
  - Sharp : liste blanche de formats (SVG refusé), `autoOrient`, 1920 px max, JPEG
  - test `node --test` du traitement : image valide, fichier corrompu, SVG refusé
- [x] T05 — Intégrer Cloudinary
  - `upload_stream` depuis le buffer Sharp, configuration par `CLOUDINARY_URL`
- [x] T06 — Connecter MongoDB avec Prisma
  - Prisma `6.19.3` figé, modèle `Photo`, `prisma db push`, client unique
  - si l'enregistrement échoue, supprimer l'image Cloudinary
- [x] T07 — Créer la route GET /api/photos
  - `?limit=N`, plus récente en premier
- [x] T08 — Intégrer Socket.IO
  - `io.emit('photo:new', photo)` après l'enregistrement
- [x] T09 — Afficher la dernière photo
  - `frame.html` : chargement initial via GET, mise à jour en temps réel, pseudo affiché, plein écran, reconnexion
- [ ] T10 — Tester le parcours complet
  - envoi depuis un smartphone sur le réseau local (vérifier le cas HEIC iPhone)
  - vérifier l'image dans Cloudinary et le document dans Atlas
  - README de démarrage
- [x] T11 — Refonte UI (J5, après T10)
  - accueil = cadre : dernière photo au premier plan, anciennes photos dispersées en décor (consultables au clic)
  - formulaire d'envoi dans un panneau ouvert par un bouton flottant (masquable sur l'écran du cadre)
  - DA « mur de Polaroids de Noël » : 3D et micro-animations en CSS, sans dépendance, respect de `prefers-reduced-motion`

- [x] T12 — Supprimer une photo
  - `DELETE /api/photos/:id` : base puis Cloudinary, `photo:deleted` diffusé à tous les écrans
  - bouton sur la photo principale + confirmation (`<dialog>`), absent en mode `?cadre`
  - suppression ouverte à tout visiteur (choix du POC, sans authentification)

## Partie 2 — FamilyFrame 2.0 : une famille, un cadre

- [x] T19 — Modèle `Frame` et migration des données
  - schéma `Frame` + `Photo.frameId`, index `[frameId, createdAt]`
  - `lib/invite-code.ts` (`crypto.randomInt`) + test, nécessaire au cadre « Famille »
  - `prisma/migrate-frames.ts` idempotent, lancé par le service `migrate` après `db push`
  - vérifier : les photos existantes sont rattachées au cadre « Famille », relancer ne change rien
- [x] T20 — Sessions de cadre
  - `lib/auth.ts` (`jose` + `cookie`), routes `/api/frames`, `/join`, `/current`
  - CORS avec cookies (`Allow-Credentials`, `Allow-Headers`), `JWT_SECRET` dans `.env.example` (lu par compose via `env_file` ; la CI n'en a pas besoin, le test fixe le sien)
  - tests `node --test` : jeton valide / falsifié / expiré, format et normalisation du code
- [ ] T21 — Photos filtrées par cadre
  - middleware `requireFrame` sur `photosRouter`, `frameId` du jeton dans GET / POST / DELETE (`404` pour un autre cadre)
- [ ] T22 — Socket.IO par cadre
  - `io.use()` vérifie le cookie, `socket.join(frameId)`, `io.to(frameId).emit()`
- [ ] T23 — Front
  - accueil créer / rejoindre, `/?code=` rejoint automatiquement, `credentials: 'include'`, `withCredentials: true`
  - QR code et code d'invitation affichés sur l'écran du cadre (`qrcode`)
- [ ] T24 — Documentation : README, ARCHITECTURE (parcours d'une photo, sessions, rooms)

## Règles

- Une tâche à la fois.
- Ne cocher qu'après vérification.
- Documenter les blocages.
- Ne pas commencer les bonus avant T10.
