protocol_opt?=

project_root=--project-root .
# ^ required when using packages

help:
	@grep -E '^[ a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
	awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

compile = ligo compile contract --library $(LIGOPATH) $(project_root) ./src/$(1) -o ./compiled/$(2) $(3) $(protocol_opt)
# ^ compile contract to michelson or micheline

test = ligo run test --library $(LIGOPATH) $(project_root) ./test/$(1) $(protocol_opt)
# ^ run given test file

compile: ## compile contracts
	@if [ ! -d ./compiled ]; then mkdir ./compiled ; fi
	@echo "Compiling contracts..."
	@$(call compile,main.jsligo,dao.tz)
	@$(call compile,main.jsligo,dao.json,--michelson-format json)
	@echo "Compiled contracts"

clean: ## clean up
	@rm -rf compiled

deploy: node_modules deploy.js

deploy.js:
	@if [ ! -f ./deploy/metadata.json ]; then cp deploy/metadata.json.dist deploy/metadata.json ; fi
	@echo "Running deploy script\n"
	@cd deploy && npm start

node_modules:
	@echo "Installing deploy script dependencies"
	@cd deploy && npm install
	@echo ""

compile-lambda: ## compile a lambda (F=./lambdas/empty_operation_list.mligo make compile-lambda)
# ^ helper to compile lambda from a file, used during development of lambdas
ifndef F
	@echo 'please provide an init file (F=)'
else
	@ligo compile expression --library $(LIGOPATH) $(project_root) jsligo lambda_ --init-file $(F) $(protocol_opt)
	# ^ the lambda is expected to be bound to the name 'lambda_'
endif

pack-lambda: ## pack lambda expression (F=./lambdas/empty_operation_list.mligo make pack-lambda)
# ^ helper to get packed lambda and hash
ifndef F
	@echo 'please provide an init file (F=)'
else
	@echo 'Packed:'
	@ligo run interpret --library $(LIGOPATH) $(project_root) 'Bytes.pack(lambda_)' --init-file $(F) $(protocol_opt)
	@echo "Hash (sha256):"
	@ligo run interpret --library $(LIGOPATH) $(project_root) 'Crypto.sha256(Bytes.pack(lambda_))' --init-file $(F) $(protocol_opt)
endif

.PHONY: test
test: ## run tests (SUITE=propose make test)
ifndef SUITE
	@$(call test,cancel.test.jsligo)
	@$(call test,end_vote.test.jsligo)
	@$(call test,execute.test.jsligo)
	@$(call test,lock.test.jsligo)
	@$(call test,propose.test.jsligo)
	@$(call test,release.test.jsligo)
	@$(call test,vote.test.jsligo)
else
	@$(call test,$(SUITE).test.jsligo)
endif

lint: ## lint code
	@npx eslint ./scripts --ext .ts

sandbox-start: ## start sandbox
	@./deploy/run-sandbox

sandbox-stop: ## stop sandbox
	@docker stop sandbox
