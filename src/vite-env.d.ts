/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_PROXY_TARGET?: string;
  readonly VITE_APP_BASE_PATH?: string;
  readonly VITE_ASSET_BASE_PATH?: string;
  readonly VITE_GOOGLE_MAPS_EMBED_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
