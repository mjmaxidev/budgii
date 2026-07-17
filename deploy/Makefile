DEPLOY_DIR := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
PROJECT_ROOT := $(abspath $(DEPLOY_DIR)/..)
.DEFAULT_GOAL := deploy

-include $(DEPLOY_DIR)/.env

PLATFORM ?= linux/amd64
FRONTEND_IMAGE ?= budgii-frontend:latest
BACKEND_IMAGE ?= budgii-api:latest
DEPLOY_ARCHIVE ?= /tmp/budgii-images.tar
BACKEND_ENV ?= $(PROJECT_ROOT)/.env.backend
SSH_USER ?= ubuntu
REMOTE_DIR ?= /home/$(SSH_USER)/budgii-deploy

.PHONY: frontend-image backend-image images deploy deploy-frontend check-deploy-config

frontend-image:
	docker buildx build \
		--platform $(PLATFORM) \
		--file $(PROJECT_ROOT)/Dockerfile.frontend \
		--tag $(FRONTEND_IMAGE) \
		--load \
		$(PROJECT_ROOT)

backend-image:
	docker buildx build \
		--platform $(PLATFORM) \
		--file $(PROJECT_ROOT)/budgii-api/Dockerfile \
		--tag $(BACKEND_IMAGE) \
		--load \
		$(PROJECT_ROOT)/budgii-api

images: backend-image frontend-image

check-deploy-config:
	@test -n "$(SERVER)" || (echo "Set SERVER in deploy/.env" && exit 1)
	@test -n "$(SSH_KEY)" || (echo "Set SSH_KEY in deploy/.env" && exit 1)
	@test -f "$(SSH_KEY)" || (echo "SSH key not found: $(SSH_KEY)" && exit 1)
	@test -f "$(BACKEND_ENV)" || (echo "Backend environment not found: $(BACKEND_ENV)" && exit 1)

deploy: check-deploy-config
	@set -eu; \
	cleanup() { \
		rm -f "$(DEPLOY_ARCHIVE)"; \
		ssh -i "$(SSH_KEY)" $(SSH_USER)@$(SERVER) 'rm -f $(REMOTE_DIR)/budgii-images.tar' >/dev/null 2>&1 || true; \
	}; \
	trap cleanup EXIT INT TERM; \
	$(MAKE) -f $(DEPLOY_DIR)/Makefile images; \
	docker save --output $(DEPLOY_ARCHIVE) $(FRONTEND_IMAGE) $(BACKEND_IMAGE); \
	ssh -i "$(SSH_KEY)" $(SSH_USER)@$(SERVER) 'mkdir -p $(REMOTE_DIR)'; \
	scp -i "$(SSH_KEY)" $(DEPLOY_ARCHIVE) $(SSH_USER)@$(SERVER):$(REMOTE_DIR)/budgii-images.tar; \
	scp -i "$(SSH_KEY)" $(DEPLOY_DIR)/compose.yml $(SSH_USER)@$(SERVER):$(REMOTE_DIR)/compose.yml; \
	scp -i "$(SSH_KEY)" $(BACKEND_ENV) $(SSH_USER)@$(SERVER):$(REMOTE_DIR)/.env.backend; \
	ssh -i "$(SSH_KEY)" $(SSH_USER)@$(SERVER) \
		'cd $(REMOTE_DIR) && mkdir -p data/postgres data/uploads && chmod 600 .env.backend && docker load --input budgii-images.tar && docker compose -f compose.yml up -d --no-build && docker compose -f compose.yml ps'

deploy-frontend: check-deploy-config
	@set -eu; \
	cleanup() { \
		rm -f "$(DEPLOY_ARCHIVE)"; \
		ssh -i "$(SSH_KEY)" $(SSH_USER)@$(SERVER) 'rm -f $(REMOTE_DIR)/budgii-images.tar' >/dev/null 2>&1 || true; \
	}; \
	trap cleanup EXIT INT TERM; \
	$(MAKE) -f $(DEPLOY_DIR)/Makefile frontend-image; \
	docker save --output $(DEPLOY_ARCHIVE) $(FRONTEND_IMAGE); \
	ssh -i "$(SSH_KEY)" $(SSH_USER)@$(SERVER) 'mkdir -p $(REMOTE_DIR)'; \
	scp -i "$(SSH_KEY)" $(DEPLOY_ARCHIVE) $(SSH_USER)@$(SERVER):$(REMOTE_DIR)/budgii-images.tar; \
	scp -i "$(SSH_KEY)" $(DEPLOY_DIR)/compose.yml $(SSH_USER)@$(SERVER):$(REMOTE_DIR)/compose.yml; \
	ssh -i "$(SSH_KEY)" $(SSH_USER)@$(SERVER) \
		'cd $(REMOTE_DIR) && docker load --input budgii-images.tar && docker compose -f compose.yml up -d --no-build --force-recreate frontend && docker compose -f compose.yml ps frontend'
