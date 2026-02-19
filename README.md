# Totsar Frontend

React + Vite frontend for the Lost & Found platform.

## Run locally (without Docker)

```bash
npm install
npm run dev
```

## Docker (production build)

Build image:

```bash
npm run docker:build
```

Run container:

```bash
npm run docker:run
```

App will be available at: `http://localhost:8080`

## Docker Compose

```bash
npm run docker:up
```

Then open: `http://localhost:8080`

## Notes

- Multi-stage Docker build:
  - Stage 1: build static assets with Node
  - Stage 2: serve with Nginx
- Nginx is configured for SPA routing (`try_files ... /index.html`).
