FROM node:26.13.1-alpine3.24
RUN npm install -g corepack@0.36.0 && corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/

COPY backend/prisma backend/prisma
RUN pnpm install --frozen-lockfile --filter backend

COPY backend backend

WORKDIR /app/backend
EXPOSE 3000
CMD ["pnpm", "start"]