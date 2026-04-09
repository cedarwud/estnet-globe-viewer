/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HOME_GLOBE_IMAGERY_MODE?: 'offline' | 'google-satellite';
  readonly VITE_GOOGLE_MAP_TILES_API_KEY?: string;
  readonly VITE_GOOGLE_MAP_TILES_LANGUAGE?: string;
  readonly VITE_GOOGLE_MAP_TILES_REGION?: string;
  readonly VITE_GOOGLE_MAP_TILES_ZOOM?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
