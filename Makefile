BINARY_NAME=ocg

## help: print this help message
.PHONY: help
help:
	@echo 'Usage:'
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' |  sed -e 's/^/ /'

## dev: dev the application
.PHONY: dev
dev:
	air \
		--build.exclude_dir "" \
		--build.include_ext "go" \
		--misc.clean_on_exit "true" \
		--build.cmd "make build" --build.bin "./${BINARY_NAME}" --build.delay "100"

## test: test the application
.PHONY: test
test:
	mkdir -p .coverage
	go test -v -race -cover -p 1 -coverprofile=.coverage/coverage.out ./...
	go tool cover -html=.coverage/coverage.out -o .coverage/coverage.html

## tidy: format code and tidy modfile
.PHONY: tidy
tidy:
	go fmt ./...
	go mod tidy -v

## clean: format code and tidy modfile
.PHONY: clean
clean:
	go clean
	rm -f ${BINARY_NAME}
