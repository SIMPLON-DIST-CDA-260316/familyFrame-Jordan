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
- [ ] T05 — Intégrer Cloudinary
  - `upload_stream` depuis le buffer Sharp, configuration par `CLOUDINARY_URL`
- [ ] T06 — Connecter MongoDB avec Prisma
  - Prisma `6.19.3` figé, modèle `Photo`, `prisma db push`, client unique
  - si l'enregistrement échoue, supprimer l'image Cloudinary
- [ ] T07 — Créer la route GET /api/photos
  - `?limit=N`, plus récente en premier
- [ ] T08 — Intégrer Socket.IO
  - `io.emit('photo:new', photo)` après l'enregistrement
- [ ] T09 — Afficher la dernière photo
  - `frame.html` : chargement initial via GET, mise à jour en temps réel, pseudo affiché, plein écran, reconnexion
- [ ] T10 — Tester le parcours complet
  - envoi depuis un smartphone sur le réseau local (vérifier le cas HEIC iPhone)
  - vérifier l'image dans Cloudinary et le document dans Atlas
  - README de démarrage

## Règles

- Une tâche à la fois.
- Ne cocher qu'après vérification.
- Documenter les blocages.
- Ne pas commencer les bonus avant T10.
