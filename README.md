# FamilyFrame

[![CI](https://github.com/SIMPLON-DIST-CDA-260316/familyFrame-Jordan/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/SIMPLON-DIST-CDA-260316/familyFrame-Jordan/actions/workflows/ci.yml)

Cadre photo connecté (MVP) : un proche envoie une photo depuis son smartphone, elle apparaît aussitôt sur le cadre, sans rechargement.

**Stack** : pnpm · React + Vite · Express 5 · Socket.IO · MongoDB 8 + Prisma 6 · Multer + Sharp · Cloudinary · TypeScript (exécuté directement par Node, sans build côté backend) · Docker Compose.

## Parcours d'une photo

```
Smartphone (/ › Envoyer)    Backend Express :3000                      Cadre (/?cadre)
pseudo + photo ──POST /api/photos──► Multer   : mémoire, 10 Mo max, 1 fichier
                                     Sharp    : vérifie le vrai format, décode puis réencode en JPEG
                                                (redressée, 1920 px max, métadonnées/GPS supprimés)
                                     Cloudinary : hébergement de l'image
                                     Prisma   : url, publicId, pseudo, date → MongoDB
                                     Socket.IO : io.emit('photo:new') ──────────► affichage instantané
                            GET /api/photos ◄───────────────────────────────────── dernière photo au (re)chargement
```

L'accueil est un mur de Polaroids : la dernière photo au premier plan, les 12 précédentes en décor (cliquer pour agrandir). Animations en CSS, désactivées si le système demande moins d'animations.

## Architecture Docker

Services orchestrés par Docker Compose : `front` (Vite en dev, nginx en prod), `api` (Express + Socket.IO), `database` (MongoDB 8 en replica set), `migrate` (pousse le schéma Prisma puis s'arrête) et, en dev, `mongo-express`. Le navigateur appelle lui-même le front et l'API ; `front` reste à l'écart du réseau `backend`, que partagent les autres services.

**Schémas dev et prod, réseaux, volume et ordre de démarrage : voir [ARCHITECTURE.md](ARCHITECTURE.md).**

À chaque lancement, `migrate` exécute `prisma db push` pour créer les index (sans effet s'ils existent déjà), puis s'arrête ; `api` ne démarre qu'une fois `migrate` terminé avec succès. L'image de prod de l'API ne contient donc pas le CLI Prisma.

## Prérequis

- **Docker** avec Docker Compose
- **make** (sur Arch : paquet `base-devel`, sur Debian/Ubuntu : `build-essential`)
- Un compte **Cloudinary** (gratuit)
- Facultatif, pour `pnpm typecheck` et `pnpm test` hors Docker : **Node.js 26** et **pnpm 12**. Node 26 ne fournit plus corepack : `npm install -g corepack && corepack enable` (installe la version de pnpm fixée par `packageManager`), puis `pnpm install`

### Cloudinary
1. Créer un compte, puis ouvrir **Settings › API Keys** dans la console.
2. Copier l'**API environment variable** : `cloudinary://<api_key>:<api_secret>@<cloud_name>` (remplacer les marqueurs par la vraie clé et le vrai secret).

## Démarrage

```bash
cp backend/.env.example backend/.env    # puis renseigner CLOUDINARY_URL
make dev                                # construit les images et lance database, migrate, api, front et mongo-express
```

Le premier lancement télécharge les images et installe les dépendances (quelques minutes). `migrate` apparaît ensuite comme `Exited (0)` : c'est normal, il a fini son travail.

| Mode | Commande | Fichiers chargés | Différences |
|---|---|---|---|
| Dev | `make dev` (ou `docker compose up -d --build`) | `compose.yaml` + `compose.override.yaml` | hot reload : `src/` monté depuis l'hôte, API relancée par `node --watch`, mongo-express |
| Prod | `make prod` (ou `docker compose -f compose.yaml up -d --build`) | `compose.yaml` | code figé dans l'image ; API lancée par `node` sans root (ni pnpm, ni CLI Prisma, ni TypeScript) ; front construit (`pnpm build`) et servi par nginx |

Sans `-f`, Docker Compose charge automatiquement `compose.override.yaml` : `docker compose up` lance donc le **dev**. La prod se lance toujours explicitement (`make prod`) ; sur un serveur, on ne copierait pas l'override. Faire `make down` avant de changer de mode.

Les deux modes partagent la même base (volume `mongo-data`). Le hot reload ne couvre que `backend/src` et `frontend/src` : après un changement de `package.json`, `schema.prisma`, `vite.config.ts`, `index.html` ou `public/`, relancer `make dev` (rebuild).

| Page | URL |
|---|---|
| Mur de photos + bouton « Envoyer une photo » | http://localhost:5173/ |
| Cadre numérique (sans bouton ni curseur) | http://localhost:5173/?cadre (plein écran : F11) |
| Consulter la base (mongo-express, dev uniquement) | http://localhost:8081 — identifiant `admin`, mot de passe `pass` (valeurs par défaut de l'image ; port ouvert seulement sur le PC) |

`backend/.env` contient des secrets : il est ignoré par git et par Docker (jamais copié dans les images), et ne doit jamais être commité.

### Depuis un smartphone (même Wi-Fi)

Le navigateur du téléphone doit joindre l'API par l'adresse du PC, pas par `localhost` (qui serait le téléphone lui-même) :

```bash
ip -4 addr          # trouver l'adresse du PC sur le Wi-Fi, ex. 192.168.1.20
echo "HOST_IP=192.168.1.20" > .env      # .env à la racine, lu par Docker Compose
make dev                                # recrée api et front avec cette adresse
```

Ouvrir ensuite `http://192.168.1.20:5173/` **sur le téléphone comme sur le PC** : l'API n'autorise qu'une seule origine (CORS). Supprimer `.env` pour revenir à `localhost`. En prod, l'adresse est inscrite dans le JS au build : relancer `make prod` (qui reconstruit) après chaque changement de `HOST_IP`.

## Commandes utiles

| Commande | Rôle |
|---|---|
| `make dev` / `make prod` | (re)construit les images et lance les services (voir Démarrage) |
| `make logs` | logs de tous les services en continu (`docker compose logs -f api` pour l'API seule) |
| `make down` | arrête et supprime les conteneurs ; les photos restent dans le volume |
| `docker compose ps -a` | état des services (`database` doit être `healthy`, `migrate` en `Exited (0)`) |
| `docker compose down -v` | ⚠️ supprime aussi le volume : **toutes les photos en base sont perdues** |
| `docker compose exec database mongosh familyframe` | console MongoDB (ex. `db.Photo.find()`) |
| `pnpm typecheck` | vérification TypeScript des deux paquets |
| `pnpm test` | tests du traitement d'image (backend) et de la fusion des photos du mur (frontend) |

## Intégration continue (GitHub Actions)

Workflow : [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (schéma dans [ARCHITECTURE.md](ARCHITECTURE.md#ci)).

| Événement | Jobs |
|---|---|
| Push sur `dev` | `test` (`pnpm typecheck` + `pnpm test`), puis, s'il réussit, `publish` : construit les images de prod de l'API et du front et les pousse sur GHCR |
| PR vers `main` | `test` seulement ; la fusion est bloquée tant qu'il échoue (règle de protection de `main`) |

Images publiées (tags `dev` = dernier push sur `dev`, `sha-<commit>` = version figée, pour revenir en arrière) :

```bash
docker pull ghcr.io/simplon-dist-cda-260316/familyframe-jordan-api:dev
docker pull ghcr.io/simplon-dist-cda-260316/familyframe-jordan-front:dev
```

L'image front appelle l'API sur `http://localhost:3000` (adresse inscrite au build) : elle sert à lancer l'app sur son propre PC.

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
| `api` ne démarre pas | `migrate` a échoué : `docker compose logs migrate` |
| `api` s'arrête : `CLOUDINARY_URL manquante` | `backend/.env` absent ou incomplet |
| `env file backend/.env not found` au lancement | `backend/.env` n'a pas été créé depuis `.env.example` |
| `database` reste `unhealthy` | voir `docker inspect familyframe-database-1` ; le `host` du `rs.initiate` du healthcheck doit être le nom du service (`database:27017`) |
| `500` à l'envoi, `Unknown API key` dans les logs | identifiants Cloudinary incorrects |
| Mur vide, erreur CORS dans la console du navigateur | page ouverte par une autre adresse que celle de `HOST_IP` (ou `localhost` sans `HOST_IP`) |
| `415 Photo HEIC non prise en charge` | fichier HEIC envoyé tel quel : régler l'iPhone sur « Le plus compatible » ou envoyer un JPEG |
| Le téléphone n'accède pas à la page | pas sur le même Wi-Fi, `HOST_IP` non défini, ou pare-feu qui bloque les ports 5173 et 3000 |
| Le cadre affiche « Connexion au serveur en cours… » | `api` arrêtée : il se reconnecte seul au redémarrage |
