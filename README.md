# Janus - OpenAPI & AsyncAPI Editor

Janus is a modern, lightweight, and offline-capable OpenAPI and AsyncAPI editor and viewer. Built with React and TypeScript, it provides a seamless developer experience for designing and visualizing APIs.

## Features

- **Split-View Editor:** High-performance code editing with Monaco Editor (collapsible).
- **Live Preview:** Instant rendering for OpenAPI 2.0/3.x (via Swagger UI) and AsyncAPI 2.x/3.x (custom renderer).
- **Sharing:** Compressed URL hash sharing (`pako` deflate + base64url) — no backend required.
- **Format Support:** Native JSON and YAML with auto-detection and pretty-printing.
- **Import / Export:** Load any `.json`, `.yaml`, or `.yml` file; export as JSON or YAML.
- **PWA:** Installable on desktop or mobile for offline use.
- **Theme:** Light, dark, and system-preference modes.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1+)

### Installation

```bash
bun install
```

### Development

```bash
bun run dev
```

### Build

```bash
bun run build
```

### Tests

```bash
bun run test
```

## Documentation

- [Architecture & 3rd Party Services](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/ARCHITECTURE.md#4-deployment-pipeline)

## Deployment

Janus is deployed as a Dockerized Nginx application on the Contabo VPS (`167.86.70.240`). See `Dockerfile` and `nginx.conf` for details.

## License

Private
