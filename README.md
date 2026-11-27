# FamilyFrame

[![CI](https://github.com/SIMPLON-DIST-CDA-260316/familyFrame-Jordan/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/SIMPLON-DIST-CDA-260316/familyFrame-Jordan/actions/workflows/ci.yml)

Cadre photo connecté (MVP) : un proche envoie une photo depuis son smartphone, elle apparaît aussitôt sur le cadre, sans rechargement.

Chaque famille a son propre cadre : on le rejoint en scannant son QR code ou en saisissant son code d'invitation, et seuls ses membres voient et reçoivent ses photos.

**Stack** : pnpm · React + Vite · Express 5 · Socket.IO · MongoDB 8 + Prisma 6 · Multer + Sharp · Cloudinary · jose (JWT) · TypeScript (exécuté directement par Node, sans build côté backend) · Docker Compose.

## Parcours d'une photo

```
Smartphone (/ › Envoyer)    Backend Express :3000                      Cadre (/?cadre)
pseudo + photo ──POST /api/photos──► Session  : cookie → JWT vérifié → frameId (401 sinon)
+ cookie de session                  Multer   : mémoire, 10 Mo max, 1 fichier
                                     Sharp    : vérifie le vrai format, décode puis réencode en JPEG
                                                (redressée, 1920 px max, métadonnées/GPS supprimés)
                                     Cloudinary : hébergement de l'image
                                     Prisma   : url, publicId, pseudo, date, frameId → MongoDB
                                     Socket.IO : io.to(frameId).emit('photo:new') ──► affichage instantané
                                                 (room du cadre : les autres cadres ne reçoivent rien)
                            GET /api/photos ◄───────────────────────────────────── photos du cadre au (re)chargement
```

Version détaillée, avec la connexion au cadre : [diagramme de séquence](ARCHITECTURE.md#sessions-et-temps-réel-par-cadre).

L'accueil est un mur de Polaroids : la dernière photo au premier plan, les 12 précédentes en décor (cliquer pour agrandir). Animations en CSS, désactivées si le système demande moins d'animations. La pastille en haut à gauche indique le cadre courant et ouvre « Mon cadre ».

## Cadres et invitations

Mise en place type :

1. Le petit-fils ouvre l'app sur son téléphone et **crée un cadre** (« Chez Mamie »).
2. Sur la tablette de Mamie, il **saisit le code d'invitation** (pastille › « Mon cadre »), puis touche **« Afficher en mode cadre »** et passe en plein écran.
3. Le reste de la famille **scanne le QR code** affiché dans un coin du cadre : le lien `/?code=…` rejoint le cadre directement.

- **Un navigateur = un cadre** : rejoindre ou créer un autre cadre (« Changer de cadre ») remplace la session.
- **Session** : cookie `HttpOnly` (illisible par le JavaScript de la page) contenant un JWT signé avec `JWT_SECRET`, valable 1 an. Le serveur lit toujours le cadre dans ce jeton, jamais dans l'URL : impossible de demander les photos d'un autre cadre.
- **Code d'invitation** : 10 caractères, sans 0/O, 1/I/L ni U ; la saisie ignore la casse, les espaces et les tirets.
- **Photos d'avant les cadres** : le service `migrate` les rattache à un cadre « Famille » (voir ci-dessous).

## Architecture Docker

Services orchestrés par Docker Compose : `front` (Vite en dev, nginx en prod), `api` (Express + Socket.IO), `database` (MongoDB 8 en replica set), `migrate` (pousse le schéma Prisma puis s'arrête) et, en dev, `mongo-express`. Le navigateur appelle lui-même le front et l'API ; `front` reste à l'écart du réseau `backend`, que partagent les autres services.

**Schémas dev et prod, réseaux, volume et ordre de démarrage : voir [ARCHITECTURE.md](ARCHITECTURE.md).**

À chaque lancement, `migrate` exécute `prisma db push` pour créer les index (sans effet s'ils existent déjà), puis `prisma/migrate-frames.ts`, qui rattache les photos sans cadre à un nouveau cadre « Famille » et affiche son code d'invitation dans `docker compose logs migrate` (sans effet ensuite). Il s'arrête alors ; `api` ne démarre qu'une fois `migrate` terminé avec succès. L'image de prod de l'API ne contient donc pas le CLI Prisma.

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
cp backend/.env.example backend/.env    # puis renseigner CLOUDINARY_URL et JWT_SECRET
openssl rand -base64 32                 # génère une valeur pour JWT_SECRET (32 caractères minimum)
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
| Accueil (rejoindre ou créer un cadre), puis mur de photos + « Envoyer une photo » + pastille « Mon cadre » | http://localhost:5173/ |
| Cadre numérique (sans bouton ni curseur, avec le QR code d'invitation) | http://localhost:5173/?cadre (plein écran : F11) |
| Lien d'invitation (contenu du QR code) : rejoint le cadre directement | http://localhost:5173/?code=XXXXXXXXXX |
| Consulter la base (mongo-express, dev uniquement) | http://localhost:8081 — identifiant `admin`, mot de passe `pass` (valeurs par défaut de l'image ; port ouvert seulement sur le PC) |

`backend/.env` contient des secrets (`CLOUDINARY_URL`, `JWT_SECRET`) : il est ignoré par git et par Docker (jamais copié dans les images), et ne doit jamais être commité.

### Depuis un smartphone (même Wi-Fi)

Le navigateur du téléphone doit joindre l'API par l'adresse du PC, pas par `localhost` (qui serait le téléphone lui-même) :

```bash
ip -4 addr          # trouver l'adresse du PC sur le Wi-Fi, ex. 192.168.1.20
echo "HOST_IP=192.168.1.20" > .env      # .env à la racine, lu par Docker Compose
make dev                                # recrée api et front avec cette adresse
```

Ouvrir ensuite `http://192.168.1.20:5173/` **sur le téléphone comme sur le PC** : l'API n'autorise qu'une seule origine (CORS). Supprimer `.env` pour revenir à `localhost`.

Le QR code du cadre contient l'adresse de la page du cadre : ouvrir le cadre via `http://192.168.1.20:5173/?cadre`, sinon le QR code pointe vers `localhost`, injoignable depuis le téléphone. Pour le navigateur, `localhost` et l'adresse IP sont deux sites différents : le cookie de session n'est pas partagé, il faut rejoindre le cadre une fois sur chaque adresse. En prod, l'adresse est inscrite dans le JS au build : relancer `make prod` (qui reconstruit) après chaque changement de `HOST_IP`.

## Commandes utiles

| Commande | Rôle |
|---|---|
| `make dev` / `make prod` | (re)construit les images et lance les services (voir Démarrage) |
| `make logs` | logs de tous les services en continu (`docker compose logs -f api` pour l'API seule) |
| `make down` | arrête et supprime les conteneurs ; les photos restent dans le volume |
| `docker compose ps -a` | état des services (`database` doit être `healthy`, `migrate` en `Exited (0)`) |
| `docker compose down -v` | ⚠️ supprime aussi le volume : **toutes les photos en base sont perdues** |
| `docker compose exec database mongosh familyframe` | console MongoDB (ex. `db.Frame.find()`, `db.Photo.find()`) |
| `pnpm typecheck` | vérification TypeScript des deux paquets |
| `pnpm test` | tests du traitement d'image, des jetons de session et des codes d'invitation (backend), et de la fusion des photos du mur (frontend) |

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
| POST | `/api/frames` | JSON `{ "name": "…" }` (1 à 50 caractères) | `201` + le cadre ; pose le cookie de session |
| POST | `/api/frames/join` | JSON `{ "code": "…" }` | `200` + le cadre ; pose le cookie ; `404` si code inconnu |
| GET | `/api/frames/current` | cookie | le cadre (`id`, `name`, `inviteCode`, `createdAt`), `401` sans session valide |
| POST | `/api/photos` | multipart : `pseudo` (1 à 30 caractères) puis `photo` (fichier) | `201` + la photo enregistrée dans le cadre de la session |
| GET | `/api/photos?limit=N` | `N` entier de 1 à 100 (20 par défaut) | photos du cadre, la plus récente en premier |
| DELETE | `/api/photos/:id` | identifiant MongoDB (24 caractères hexadécimaux) | `204` (supprimée en base puis sur Cloudinary), `404` si inconnue ou d'un autre cadre |

Les routes `/api/photos` exigent le cookie de session (`401` sinon) et ne voient que le cadre du jeton. Tout membre d'un cadre peut supprimer ses photos ; le bouton n'apparaît pas en mode `?cadre`.

Socket.IO : la connexion est refusée sans session valide (`connect_error`), puis chaque socket rejoint la room de son cadre. Événements (serveur → écrans du cadre) : `photo:new` avec la photo enregistrée, `photo:deleted` avec l'identifiant supprimé.

Erreurs : JSON `{ "error": "…" }` avec `400`, `401` (pas de session), `404`, `413` (trop lourd), `415` (format refusé) ou `500`.

## Dépannage

| Symptôme | Cause probable |
|---|---|
| `api` ne démarre pas | `migrate` a échoué : `docker compose logs migrate` |
| `api` s'arrête : `CLOUDINARY_URL manquante` | `backend/.env` absent ou incomplet |
| `api` s'arrête : `JWT_SECRET manquant ou trop court` | `JWT_SECRET` absent de `backend/.env` ou de moins de 32 caractères (vérifier aussi que la ligne précédente se termine par un retour à la ligne) |
| `env file backend/.env not found` au lancement | `backend/.env` n'a pas été créé depuis `.env.example` |
| `database` reste `unhealthy` | voir `docker inspect familyframe-database-1` ; le `host` du `rs.initiate` du healthcheck doit être le nom du service (`database:27017`) |
| `500` à l'envoi, `Unknown API key` dans les logs | identifiants Cloudinary incorrects |
| `415 Photo HEIC non prise en charge` | fichier HEIC envoyé tel quel : régler l'iPhone sur « Le plus compatible » ou envoyer un JPEG |
| Le téléphone n'accède pas à la page | pas sur le même Wi-Fi, `HOST_IP` non défini, ou pare-feu qui bloque les ports 5173 et 3000 |
| La page reste sur « Connexion au serveur en cours… » | `api` arrêtée (la page se reconnecte seule au redémarrage), ou page ouverte par une autre adresse que celle de `HOST_IP`, ou par `localhost` sans `HOST_IP` : l'API la refuse (CORS, voir la console du navigateur) |
| « Code d'invitation inconnu. » | code mal recopié : il est affiché sous le QR code du cadre, dans « Mon cadre », ou dans mongo-express (collection `Frame`) |
| Le QR code ne s'ouvre pas sur le téléphone | cadre ouvert sur `localhost` : l'ouvrir par l'adresse de `HOST_IP` |
| Retour à l'accueil en changeant d'adresse (`localhost` ↔ IP) | le cookie de session est propre à chaque adresse : rejoindre le cadre à nouveau |
