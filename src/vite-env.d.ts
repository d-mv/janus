/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_LOGGER_API_BASE_URL?: string;
  readonly VITE_LOGGER_INGEST_KEY?: string;
}
