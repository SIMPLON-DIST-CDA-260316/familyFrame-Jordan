DEV  = docker compose -f compose.yaml -f compose.dev.yaml
PROD = docker compose -f compose.yaml

# Dev : hot reload (code source monté, node --watch pour l'API)
dev:
	$(DEV) up -d --build

prod:
	$(PROD) up -d --build

# Les photos restent dans le volume mongo-data
down:
	docker compose down

logs:
	docker compose logs -f

.PHONY: dev prod down logs
