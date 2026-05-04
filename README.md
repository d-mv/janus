# Janus - OpenAPI & AsyncAPI Editor

Janus is a modern, lightweight, and offline-capable OpenAPI and AsyncAPI editor and viewer. Built with React and TypeScript, it provides a seamless developer experience for designing and visualizing APIs.

## Features

- **Split-View Editor:** High-performance code editing with Monaco Editor.
- **Live Preview:** Instant rendering for both OpenAPI (via Swagger UI) and AsyncAPI.
- **Sharing:** Compressed URL hash sharing for quick collaboration without a backend.
- **Format Support:** Native support for JSON and YAML.
- **PWA:** Can be installed on your desktop or mobile device for offline use.
- **Observability:** Integrated remote logging for error tracking and usage analytics.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Documentation

- [Architecture & 3rd Party Services](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/ARCHITECTURE.md#4-deployment-pipeline)

## Deployment

Janus is deployed to Fly.io as a Dockerized Nginx application. See `fly.toml` and `Dockerfile` for details.

## License

Private
