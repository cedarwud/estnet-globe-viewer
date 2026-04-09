export type EarthAppearanceProfileId =
  | 'offline-balanced-v1'
  | 'offline-balanced-v2'
  | 'offline-balanced-v3'
  | 'google-satellite-home-v1';
export type EarthTextureQuality = 'runtime-4k-webp' | 'runtime-google-satellite-composite';
export type EarthTextureAvailability =
  | 'none-approved'
  | 'approved-runtime'
  | 'api-enhanced-runtime';
export type ImageryProviderAvailability = 'configured' | 'unconfigured';

export interface EarthTextureSet {
  availability: EarthTextureAvailability;
  dayTextureUrl: string | null;
  dayAssetId: string | null;
  nightTextureUrl: string | null;
  nightAssetId: string | null;
  cloudTextureUrl: string | null;
  cloudAssetId: string | null;
  appearanceProfileId: EarthAppearanceProfileId;
  textureQuality: EarthTextureQuality;
  governanceDocPath: string;
  note: string;
}

export interface ImageryProvider {
  providerId: string;
  providerKind: 'empty' | 'static' | 'api';
  availability: ImageryProviderAvailability;
  availabilityReason: string | null;
  // Step 0 keeps the imagery seam synchronous and minimal. Future loading behavior
  // can change behind this boundary once approved assets exist.
  getEarthTextureSet(): EarthTextureSet | null;
  loadEarthTextureSet?(signal: AbortSignal): Promise<EarthTextureSet | null>;
}

interface StaticImageryProviderConfig {
  providerId: string;
  providerKind: ImageryProvider['providerKind'];
  textureSet: EarthTextureSet | null;
}

export function createStaticImageryProvider(config: StaticImageryProviderConfig): ImageryProvider {
  const stableTextureSet = config.textureSet ? Object.freeze({ ...config.textureSet }) : null;

  return {
    providerId: config.providerId,
    providerKind: config.providerKind,
    availability: 'configured',
    availabilityReason: null,
    getEarthTextureSet() {
      // Step 5 keeps static imagery provider state immutable so appearance policy
      // and asset metadata stay a provider concern instead of being mutated in-scene.
      return stableTextureSet;
    },
  };
}
