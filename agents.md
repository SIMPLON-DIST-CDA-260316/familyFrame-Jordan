# FamilyFrame — Instructions pour les agents IA

## Contexte

Projet pédagogique CDA.
Développer un POC de cadre photo connecté en 7 heures.

L'objectif principal de la semaine est Docker.
Ne pas complexifier inutilement le POC.

## Stack imposée

- pnpm (workspace) — Node.js 26
- React + Vite (template `react-ts`)
- Express.js 5
- Socket.IO 4
- MongoDB Atlas + Prisma 6 (`6.19.3`, version figée : Prisma 7 ne supporte pas MongoDB, Prisma 8 est en RC)
- Multer 2 + Sharp
- Cloudinary (SDK v2)
- TypeScript

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
- Erreurs renvoyées en JSON `{ error }` avec le bon statut (400, 413, 415, 500), sans détail interne.

## Validation

Après chaque tâche :

- Expliquer les modifications.
- Indiquer comment tester.
- Exécuter les tests disponibles (`pnpm typecheck`, `node --test`).
- Signaler ce qui reste à vérifier.
- Rappeler de commiter (un commit atomique par tâche) et proposer le message au format Conventional Commits, ex. `feat(T03): …`.

## Interdictions

- Pas de Docker le premier jour.
- Pas d'authentification.
- Pas de fonctionnalités bonus.
- Pas de sur-ingénierie.
