import { offlineEarthImageryProvider } from './offlineEarthImageryProvider';
import type { EarthTextureSet, ImageryProvider } from './provider';

const GOOGLE_TILE_API_BASE_URL = 'https://tile.googleapis.com/v1';
const MAX_MERCATOR_LATITUDE_DEG = 85.05112878;
const MIN_HOME_GLOBE_TILE_ZOOM = 2;
const DEFAULT_HOME_GLOBE_TILE_ZOOM = 3;
const MAX_HOME_GLOBE_TILE_ZOOM = 4;
const TILE_FETCH_CONCURRENCY = 8;
const JPEG_EXPORT_QUALITY = 0.92;

export type GoogleMapTilesFailureMode = 'none' | 'session' | 'tile';

interface GoogleMapTilesSatelliteConfig {
  apiKey: string | null;
  language: string;
  region: string;
  zoom?: number;
  failureMode?: GoogleMapTilesFailureMode;
}

interface GoogleMapTilesSessionResponse {
  session: string;
  expiry: string;
  tileWidth: number;
  tileHeight: number;
  imageFormat: 'png' | 'jpeg';
}

interface WorldTileTask {
  x: number;
  y: number;
}

function clampHomeGlobeTileZoom(rawZoom: number | undefined) {
  const zoom = Number.isFinite(rawZoom) ? Math.round(rawZoom ?? DEFAULT_HOME_GLOBE_TILE_ZOOM) : DEFAULT_HOME_GLOBE_TILE_ZOOM;
  return Math.min(MAX_HOME_GLOBE_TILE_ZOOM, Math.max(MIN_HOME_GLOBE_TILE_ZOOM, zoom));
}

function abortIfNeeded(signal: AbortSignal) {
  if (signal.aborted) {
    throw new DOMException('The Google Map Tiles imagery request was aborted.', 'AbortError');
  }
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to acquire a 2D canvas context for Google Map Tiles imagery composition.');
  }

  return { canvas, context };
}

async function decodeFetchedImage(response: Response, requestUrl: string, signal: AbortSignal) {
  if (!response.ok) {
    const responseBody = await response.text().catch(() => '');
    const suffix = responseBody ? ` ${responseBody}` : '';
    throw new Error(`Google Map Tiles tile request failed (${response.status}) for ${requestUrl}.${suffix}`.trim());
  }

  const imageBlob = await response.blob();
  abortIfNeeded(signal);

  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(imageBlob);
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(imageBlob);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Unable to decode Google Map Tiles image data from ${requestUrl}.`));
    };

    image.src = objectUrl;
  });
}

async function mapWithConcurrency<T>(
  count: number,
  concurrency: number,
  mapper: (index: number) => Promise<T>
) {
  const results = new Array<T>(count);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, count) }, async () => {
    while (nextIndex < count) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(index);
    }
  });

  await Promise.all(workers);
  return results;
}

async function createSatelliteSession(params: {
  apiKey: string;
  language: string;
  region: string;
  signal: AbortSignal;
  failureMode: GoogleMapTilesFailureMode;
}) {
  if (params.failureMode === 'session') {
    throw new Error('Google Map Tiles satellite session failure was forced for fallback validation.');
  }

  const sessionResponse = await fetch(
    `${GOOGLE_TILE_API_BASE_URL}/createSession?key=${encodeURIComponent(params.apiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mapType: 'satellite',
        language: params.language,
        region: params.region,
      }),
      signal: params.signal,
    }
  );

  if (!sessionResponse.ok) {
    const responseBody = await sessionResponse.text().catch(() => '');
    const suffix = responseBody ? ` ${responseBody}` : '';
    throw new Error(`Google Map Tiles session request failed (${sessionResponse.status}).${suffix}`.trim());
  }

  const payload = (await sessionResponse.json()) as Partial<GoogleMapTilesSessionResponse>;
  if (
    typeof payload.session !== 'string' ||
    typeof payload.tileWidth !== 'number' ||
    typeof payload.tileHeight !== 'number' ||
    (payload.imageFormat !== 'png' && payload.imageFormat !== 'jpeg')
  ) {
    throw new Error('Google Map Tiles session response was missing one or more required fields.');
  }

  return {
    session: payload.session,
    expiry: typeof payload.expiry === 'string' ? payload.expiry : '',
    tileWidth: payload.tileWidth,
    tileHeight: payload.tileHeight,
    imageFormat: payload.imageFormat,
  } satisfies GoogleMapTilesSessionResponse;
}

async function buildWorldMercatorCanvas(params: {
  apiKey: string;
  sessionToken: string;
  signal: AbortSignal;
  tileWidth: number;
  tileHeight: number;
  zoom: number;
  failureMode: GoogleMapTilesFailureMode;
}) {
  const worldTileCount = 2 ** params.zoom;
  const { canvas, context } = createCanvas(
    params.tileWidth * worldTileCount,
    params.tileHeight * worldTileCount
  );
  const tileTasks: WorldTileTask[] = [];

  for (let y = 0; y < worldTileCount; y += 1) {
    for (let x = 0; x < worldTileCount; x += 1) {
      tileTasks.push({ x, y });
    }
  }

  const tileResults = await mapWithConcurrency(
    tileTasks.length,
    TILE_FETCH_CONCURRENCY,
    async (index) => {
      abortIfNeeded(params.signal);

      const tile = tileTasks[index];
      if (!tile) {
        throw new Error(`Google Map Tiles tile index ${index} is outside the world tile task range.`);
      }

      if (params.failureMode === 'tile' && tile.x === 0 && tile.y === 0) {
        throw new Error('Google Map Tiles tile download failure was forced for fallback validation.');
      }

      const tileUrl =
        `${GOOGLE_TILE_API_BASE_URL}/2dtiles/${params.zoom}/${tile.x}/${tile.y}` +
        `?session=${encodeURIComponent(params.sessionToken)}&key=${encodeURIComponent(params.apiKey)}`;
      const tileResponse = await fetch(tileUrl, { signal: params.signal });
      const image = await decodeFetchedImage(tileResponse, tileUrl, params.signal);

      return {
        ...tile,
        image,
      };
    }
  );

  tileResults.forEach((tile) => {
    context.drawImage(
      tile.image,
      tile.x * params.tileWidth,
      tile.y * params.tileHeight,
      params.tileWidth,
      params.tileHeight
    );
  });

  return canvas;
}

function latitudeToMercatorRowRatio(latitudeDeg: number) {
  const clampedLatitude = Math.min(
    MAX_MERCATOR_LATITUDE_DEG,
    Math.max(-MAX_MERCATOR_LATITUDE_DEG, latitudeDeg)
  );
  const latitudeRadians = (clampedLatitude * Math.PI) / 180;
  const mercatorProjection = Math.log(Math.tan(Math.PI / 4 + latitudeRadians / 2));
  return (1 - mercatorProjection / Math.PI) / 2;
}

function buildEquirectangularTextureDataUrl(mercatorCanvas: HTMLCanvasElement) {
  const outputWidth = mercatorCanvas.width;
  const outputHeight = Math.max(1, Math.round(outputWidth / 2));
  const { canvas, context } = createCanvas(outputWidth, outputHeight);

  context.imageSmoothingEnabled = true;

  for (let row = 0; row < outputHeight; row += 1) {
    const latitudeDeg = 90 - ((row + 0.5) / outputHeight) * 180;
    const sourceRow =
      latitudeToMercatorRowRatio(latitudeDeg) * mercatorCanvas.height - 0.5;
    const clampedSourceRow = Math.min(
      mercatorCanvas.height - 1,
      Math.max(0, sourceRow)
    );

    // Longitude is linear in both equirectangular and Web Mercator, so the
    // home-globe composite only needs vertical reprojection row by row.
    context.drawImage(
      mercatorCanvas,
      0,
      clampedSourceRow,
      mercatorCanvas.width,
      1,
      0,
      row,
      outputWidth,
      1
    );
  }

  return canvas.toDataURL('image/jpeg', JPEG_EXPORT_QUALITY);
}

export function createGoogleMapTilesSatelliteImageryProvider(
  config: GoogleMapTilesSatelliteConfig
): ImageryProvider {
  const zoom = clampHomeGlobeTileZoom(config.zoom);
  const apiKey = config.apiKey?.trim() || null;
  const language = config.language.trim() || 'en-US';
  const region = config.region.trim() || 'US';
  const failureMode = config.failureMode ?? 'none';

  return {
    providerId: 'google-map-tiles-satellite-home-v1',
    providerKind: 'api',
    availability: apiKey ? 'configured' : 'unconfigured',
    availabilityReason: apiKey
      ? null
      : 'Google Map Tiles API key is not configured. The home globe stays on the approved offline Earth baseline.',
    getEarthTextureSet() {
      return null;
    },
    async loadEarthTextureSet(signal) {
      if (!apiKey) {
        return null;
      }

      const offlineContinuityTextureSet = offlineEarthImageryProvider.getEarthTextureSet();

      const session = await createSatelliteSession({
        apiKey,
        language,
        region,
        signal,
        failureMode,
      });
      const mercatorCanvas = await buildWorldMercatorCanvas({
        apiKey,
        sessionToken: session.session,
        signal,
        tileWidth: session.tileWidth,
        tileHeight: session.tileHeight,
        zoom,
        failureMode,
      });
      const dayTextureUrl = buildEquirectangularTextureDataUrl(mercatorCanvas);

      return {
        availability: 'api-enhanced-runtime',
        dayTextureUrl,
        dayAssetId: `google-map-tiles-satellite-z${zoom}-${session.imageFormat}`,
        nightTextureUrl: offlineContinuityTextureSet?.nightTextureUrl ?? null,
        nightAssetId: offlineContinuityTextureSet?.nightAssetId ?? null,
        cloudTextureUrl: offlineContinuityTextureSet?.cloudTextureUrl ?? null,
        cloudAssetId: offlineContinuityTextureSet?.cloudAssetId ?? null,
        appearanceProfileId: 'google-satellite-home-v3',
        textureQuality: 'runtime-google-satellite-composite',
        governanceDocPath:
          'internal/estnet-globe-viewer/devlogs/2026-04-09-home-globe-google-map-tiles-api.md',
        note:
          `Home globe day texture is a runtime equirectangular composite of Google Map Tiles API satellite tiles ` +
          `(zoom ${zoom}, ${session.tileWidth}px tiles, ${session.imageFormat}, ${language}/${region}). ` +
          'The Google day map retains subtle far-limb night continuity and the restrained cloud shell so the home globe keeps depth cues without reopening a visible black night hemisphere. ' +
          'This enhanced path is opt-in, home-globe only, and falls back to the approved offline Earth baseline when unconfigured or when session or tile requests fail. ' +
          'It does not claim AOI/local API coverage or deep-zoom parity.',
      } satisfies EarthTextureSet;
    },
  };
}
