# Architecture Docker

Deux modes, qui partagent la même base `compose.yaml` :

| Mode | Commande | Fichiers chargés |
|---|---|---|
| Dev | `make dev` (ou `docker compose up -d --build`) | `compose.yaml` + `compose.override.yaml` (chargé automatiquement sans `-f`) |
| Prod | `make prod` (ou `docker compose -f compose.yaml up -d --build`) | `compose.yaml` seul |

Légende : flèche pleine = échange réseau ; flèche pointillée = montage de fichiers ou configuration.

## Dev

```mermaid
flowchart LR
  subgraph host["PC hôte (hors Docker)"]
    browser["Navigateur<br/>(PC ou smartphone)"]
    src["Code source<br/>backend/src · frontend/src"]
    envfile["backend/.env<br/>(CLOUDINARY_URL)"]
  end

  subgraph compose["Docker Compose · projet familyframe"]
    subgraph netdefault["réseau default"]
      front["front<br/>frontend/Dockerfile · Vite (hot reload)<br/>port 5173"]
    end
    subgraph netbackend["réseau backend"]
      api["api<br/>backend/Dockerfile · node --watch<br/>port 3000"]
      database[("database<br/>mongo:8.0.38 · replica set rs0<br/>aucun port publié")]
      mongoexpress["mongo-express<br/>port 127.0.0.1:8081"]
    end
    vol[("volume mongo-data → /data/db<br/>géré par Docker · /var/lib/docker/volumes")]
  end

  cloudinary["Cloudinary<br/>(service externe)"]

  browser -- "localhost:5173" --> front
  browser -- "localhost:3000 · HTTP + WebSocket" --> api
  browser -- "127.0.0.1:8081" --> mongoexpress
  api -- "database:27017" --> database
  mongoexpress -- "database:27017" --> database
  database --- vol
  api -- "upload / suppression" --> cloudinary
  browser -- "affichage des images" --> cloudinary
  src -. "bind mount :ro" .-> api
  src -. "bind mount :ro" .-> front
  envfile -. "env_file" .-> api
```

- **Hot reload** : `backend/src` et `frontend/src` sont montés en lecture seule depuis l'hôte ; `node --watch` relance l'API, Vite met la page à jour.
- **mongo-express** (consultation de la base) n'existe qu'en dev, et son port n'est ouvert que sur le PC (`127.0.0.1`).

## Prod

```mermaid
flowchart LR
  subgraph host["PC hôte (hors Docker)"]
    browser["Navigateur<br/>(PC ou smartphone)"]
    envfile["backend/.env<br/>(CLOUDINARY_URL)"]
  end

  subgraph compose["Docker Compose · projet familyframe"]
    subgraph netdefault["réseau default"]
      front["front<br/>frontend/Dockerfile · Vite<br/>port 5173"]
    end
    subgraph netbackend["réseau backend"]
      api["api<br/>backend/Dockerfile · pnpm start<br/>port 3000"]
      database[("database<br/>mongo:8.0.38 · replica set rs0<br/>aucun port publié")]
    end
    vol[("volume mongo-data → /data/db<br/>géré par Docker · /var/lib/docker/volumes")]
  end

  cloudinary["Cloudinary<br/>(service externe)"]

  browser -- "localhost:5173" --> front
  browser -- "localhost:3000 · HTTP + WebSocket" --> api
  api -- "database:27017" --> database
  database --- vol
  api -- "upload / suppression" --> cloudinary
  browser -- "affichage des images" --> cloudinary
  envfile -. "env_file" .-> api
```

- **Code figé dans les images** : pas de bind mount ni de mongo-express ; l'API tourne en `pnpm start`.
- Le front reste pour l'instant le serveur de dev Vite (un vrai build servi par nginx viendra avec l'optimisation des images).

## Commun aux deux modes

- **Le navigateur appelle lui-même l'API** : aucune flèche entre `front` et `api`. Le front ne fait que servir les fichiers React ; il est donc seul sur le réseau `default`, séparé du réseau `backend`.
- **api → database** par le nom du service (`database:27017`) sur le réseau `backend`. MongoDB n'a aucun port publié : seuls les conteneurs de ce réseau l'atteignent.
- **Ordre de démarrage** : `api` (et `mongo-express` en dev) attend que `database` soit *healthy*. Le healthcheck initialise le replica set au premier lancement (requis par Prisma 6) et ne répond « prêt » qu'une fois MongoDB primaire.
- **Données** : les photos (métadonnées) sont dans le volume `mongo-data`, les images sur Cloudinary.
- **Depuis un smartphone** : `localhost` devient l'adresse du PC sur le Wi-Fi (`HOST_IP` dans un `.env` à la racine, voir le README).
