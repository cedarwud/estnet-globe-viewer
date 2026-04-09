import { createGoogleMapTilesSatelliteImageryProvider, type GoogleMapTilesFailureMode } from './googleMapTilesSatelliteImageryProvider';
import { offlineEarthImageryProvider } from './offlineEarthImageryProvider';
import type { ImageryProvider } from './provider';

export type HomeGlobeImageryMode = 'offline' | 'google-satellite';

export interface HomeGlobeImagerySelection {
  requestedMode: HomeGlobeImageryMode;
  requestedProvider: ImageryProvider;
  fallbackProvider: ImageryProvider;
  modeSource: 'default' | 'env' | 'query';
  failureMode: GoogleMapTilesFailureMode;
  keyOverride: 'default' | 'missing';
}

function parseHomeGlobeImageryMode(value: string | null | undefined): HomeGlobeImageryMode | null {
  if (value === 'offline' || value === 'google-satellite') {
    return value;
  }

  return null;
}

function parseFailureMode(value: string | null): GoogleMapTilesFailureMode {
  if (value === 'session' || value === 'tile') {
    return value;
  }

  return 'none';
}

function parseTileZoom(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function resolveHomeGlobeImagerySelection(search: string): HomeGlobeImagerySelection {
  const queryParameters = new URLSearchParams(search);
  const queryMode = parseHomeGlobeImageryMode(queryParameters.get('imagery'));
  const envMode = parseHomeGlobeImageryMode(import.meta.env.VITE_HOME_GLOBE_IMAGERY_MODE);
  const requestedMode = queryMode ?? envMode ?? 'offline';
  const modeSource = queryMode ? 'query' : envMode ? 'env' : 'default';
  const failureMode = parseFailureMode(queryParameters.get('imageryFail'));
  const keyOverride = queryParameters.get('imageryKey') === 'missing' ? 'missing' : 'default';
  const googleSatelliteProvider = createGoogleMapTilesSatelliteImageryProvider({
    apiKey:
      keyOverride === 'missing'
        ? null
        : import.meta.env.VITE_GOOGLE_MAP_TILES_API_KEY?.trim() || null,
    language: import.meta.env.VITE_GOOGLE_MAP_TILES_LANGUAGE?.trim() || 'en-US',
    region: import.meta.env.VITE_GOOGLE_MAP_TILES_REGION?.trim() || 'US',
    zoom: parseTileZoom(import.meta.env.VITE_GOOGLE_MAP_TILES_ZOOM),
    failureMode,
  });

  return {
    requestedMode,
    requestedProvider:
      requestedMode === 'google-satellite'
        ? googleSatelliteProvider
        : offlineEarthImageryProvider,
    fallbackProvider: offlineEarthImageryProvider,
    modeSource,
    failureMode,
    keyOverride,
  };
}
