export const SAMPLE_SPEC = JSON.stringify(
  {
    openapi: "3.0.3",
    info: {
      title: "Sample API",
      version: "1.0.0",
      description: "Edit JSON on the left. The renderer updates automatically."
    },
    servers: [{ url: "https://api.example.com" }],
    paths: {
      "/health": {
        get: {
          summary: "Health check",
          responses: {
            "200": {
              description: "Healthy"
            }
          }
        }
      }
    }
  },
  null,
  2
);
