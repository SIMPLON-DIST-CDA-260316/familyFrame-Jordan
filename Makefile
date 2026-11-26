# Sans -f, docker compose charge compose.yaml + compose.override.yaml (dev) ; avec -f compose.yaml, l'override est ignoré (prod)
DEV  = docker compose
PROD = docker compose -f compose.yaml

# Dev : hot reload (code source monté, node --watch pour l'API)
dev:
	$(DEV) up -d --build

prod:
	$(PROD) up -d --build

# $(DEV) : connaît tous les services (dont mongo-express), donc arrête aussi bien le dev que la prod. Les photos restent dans le volume mongo-data
down:
	$(DEV) down

logs:
	$(DEV) logs -f

.PHONY: dev prod down logs
