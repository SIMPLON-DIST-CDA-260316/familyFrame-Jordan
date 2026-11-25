FROM node:26.13.1-alpine3.24
RUN npm install -g corepack@0.36.0 && corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --filter frontend

COPY frontend frontend

WORKDIR /app/frontend
EXPOSE 5173
CMD ["pnpm", "dev"]
