# FamilyFrame — Instructions pour les agents IA

## Contexte

Projet pédagogique CDA.
Développer un POC de cadre photo connecté en 7 heures.

L'objectif principal de la semaine est Docker.
Ne pas complexifier inutilement le POC.

Partie 2 (FamilyFrame 2.0) : plusieurs cadres, chacun rejoint par un code d'invitation (voir spec.md). Faire évoluer l'application existante, pas la reconstruire.

## Stack imposée

- pnpm (workspace) — Node.js 26
- React + Vite (template `react-ts`)
- Express.js 5
- Socket.IO 4
- MongoDB Atlas + Prisma 6 (`6.19.3`, version figée : Prisma 7 ne supporte pas MongoDB, Prisma 8 est en RC)
- Multer 2 + Sharp
- Cloudinary (SDK v2)
- TypeScript
- Partie 2 : `jose` (JWT), `cookie` (lecture de l'en-tête Cookie), `qrcode` (front)

Consulter la documentation à jour (MCP context7) avant d'utiliser une API d'une de ces librairies.

## TypeScript sans build côté backend

- Le backend est exécuté directement par Node (`node --watch --env-file=.env src/index.ts`) : pas de `tsx`, `ts-node` ni `dist/`.
- Seule la syntaxe effaçable est autorisée (`erasableSyntaxOnly`) : pas d'`enum`, de `namespace` ni de paramètres de constructeur `public`/`private`.
- Vérification des types : `pnpm typecheck` (`tsc --noEmit`).
- Pas de `dotenv` ni de `nodemon` : `--env-file` et `--watch` sont natifs dans Node.

## Architecture

- frontend/ : application React, une seule page : mur de Polaroids + panneau d'envoi (`<dialog>`) ; `/?cadre` masque le bouton d'envoi
- backend/ : API Express + Socket.IO attaché au `http.Server`
- En local, le proxy Vite redirige `/api` et `/socket.io` vers le backend (même origine, pas de CORS).
- Séparation simple des responsabilités
- Pas de framework supplémentaire sans validation (ex. pas de React Router)
- Sans session de cadre, le front affiche l'accueil (créer ou rejoindre un cadre) ; `/?code=XXXX` (lien du QR code) rejoint automatiquement.
- Front et API sur deux origines dans Docker (même site) : `fetch` avec `credentials: 'include'`, socket avec `withCredentials: true`.

## Règles de développement

1. Lire spec.md et task.md.
2. Traiter une seule tâche à la fois.
3. Proposer un plan avant toute modification importante.
4. Ne rien coder sans l'accord explicite de l'utilisateur.
5. Modifier uniquement les fichiers nécessaires.
6. Privilégier la solution la plus simple.
7. Ne pas ajouter de fonctionnalités non demandées.
8. Ne jamais inventer de résultats de tests.
9. Signaler les problèmes et les incertitudes.
10. Git (branches, commits, push) est géré par l'utilisateur : ne jamais commiter.

## Sécurité

- Ne jamais exposer les secrets : `backend/.env` ignoré par git, `.env.example` versionné sans valeurs.
- Valider les fichiers reçus côté serveur :
  - Multer : stockage mémoire, 10 Mo max, 1 fichier, `mimetype` `image/*` (simple pré-filtre, valeur fournie par le client).
  - Sharp : vérifier le format réel (liste blanche jpeg, png, webp, heif, avif — **SVG refusé**).
- Décoder et réencoder les images avec Sharp : `autoOrient`, redimensionnement 1920 px max, sortie JPEG. Les métadonnées (EXIF, GPS) sont supprimées par défaut.
- Valider le pseudo (trim, 1 à 30 caractères).
- Limiter la taille des uploads.
- Ne jamais exposer les identifiants Cloudinary (configuration par `CLOUDINARY_URL` côté backend uniquement).
- Si l'enregistrement MongoDB échoue après l'upload, supprimer l'image Cloudinary (pas d'orphelin).
- Erreurs renvoyées en JSON `{ error }` avec le bon statut (400, 401, 404, 413, 415, 500), sans détail interne.
- Session de cadre : JWT HS256 (`jose`, `algorithms: ['HS256']` imposé à la vérification) `{ sub: frameId }`, valable 1 an, dans un cookie `HttpOnly`, `SameSite=Lax`.
- Le `frameId` vient toujours du jeton, jamais de la requête : `res.locals.frameId` côté Express, `socket.data.frameId` côté Socket.IO.
- Code d'invitation : 10 caractères tirés avec `crypto.randomInt` (alphabet sans caractères ambigus), vérifié côté serveur, saisie normalisée (casse, espaces, tirets ignorés).
- Une photo d'un autre cadre répond `404`, comme une photo inexistante.
- `JWT_SECRET` dans `backend/.env` uniquement (jamais dans le front ni dans git).

## Validation

Après chaque tâche :

- Expliquer les modifications.
- Indiquer comment tester.
- Exécuter les tests disponibles (`pnpm typecheck`, `node --test`).
- Signaler ce qui reste à vérifier.
- Rappeler de commiter (un commit atomique par tâche) et proposer le message au format Conventional Commits, ex. `feat(T03): …`.

## Interdictions

- Pas de Docker le premier jour.
- Pas de comptes utilisateurs ni de mots de passe : l'accès se fait par code d'invitation de cadre.
- Pas de fonctionnalités bonus.
- Pas de sur-ingénierie.
