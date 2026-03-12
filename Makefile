help:
	@echo "Available targets:"
	@echo "  install   Install npm dependencies"
	@echo "  dev       Start Vite + Express dev servers"
	@echo "  build     Build the frontend for production"
	@echo "  preview   Preview the production build"

dev:
	npm run dev

install:
	npm install

build:
	npm run build

preview:
	npm run preview

.PHONY: help dev install build preview
