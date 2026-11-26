# 1. Base commune au dev et au build : dépendances du front + code source
FROM node:26.13.1-alpine3.24 AS base
RUN npm install -g corepack@0.36.0 && corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --filter frontend

COPY frontend frontend

WORKDIR /app/frontend

# 2. Dev : serveur Vite (hot reload), choisi par compose.override.yaml (target: dev)
FROM base AS dev
EXPOSE 5173
CMD ["pnpm", "dev"]

# 3. Build : vérifie les types puis génère dist/ ; Vite inscrit VITE_API_URL dans le JS à ce moment-là
FROM base AS build
ARG VITE_API_URL
RUN pnpm build

# 4. Prod (dernière étape = cible par défaut) : seul dist/ est gardé, servi par nginx sans root sur le port 8080
FROM nginxinc/nginx-unprivileged:1.30.6-alpine-slim
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 8080
