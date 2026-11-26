# 1. Base commune au dev, au build et au service migrate : toutes les dépendances (dont le CLI Prisma) + code source
FROM node:26.13.1-alpine3.24 AS base
RUN npm install -g corepack@0.36.0 && corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/
# Le schéma est lu par le postinstall (prisma generate)
COPY backend/prisma backend/prisma
RUN pnpm install --frozen-lockfile --filter backend

COPY backend backend

WORKDIR /app/backend

# 2. Dev : node --watch (hot reload), choisi par compose.override.yaml (target: dev)
FROM base AS dev
EXPOSE 3000
CMD ["pnpm", "dev"]

# 3. Build : vérifie les types, puis prépare /prod/backend avec les seules dépendances de prod.
#    --ignore-scripts : le postinstall (prisma generate) échouerait sans le CLI, absent en prod ; on génère le client avec celui de cette étape.
FROM base AS build
RUN pnpm typecheck \
 && pnpm deploy --filter backend --prod --ignore-scripts /prod/backend \
 && cd /prod/backend && /app/backend/node_modules/.bin/prisma generate

# 4. Prod (dernière étape = cible par défaut) : Node + code + dépendances de prod, sans pnpm, CLI Prisma ni TypeScript, et sans root
FROM node:26.13.1-alpine3.24
WORKDIR /app
COPY --from=build /prod/backend .
USER node
EXPOSE 3000
CMD ["node", "src/index.ts"]
