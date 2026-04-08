export type EarthAppearanceProfileId = 'offline-balanced-v1';
export type EarthTextureQuality = 'runtime-4k-webp';

export interface EarthTextureSet {
  availability: 'none-approved' | 'approved-runtime';
  dayTextureUrl: string | null;
  dayAssetId: string | null;
  nightTextureUrl: string | null;
  nightAssetId: string | null;
  appearanceProfileId: EarthAppearanceProfileId;
  textureQuality: EarthTextureQuality;
  governanceDocPath: string;
  note: string;
}

export interface ImageryProvider {
  providerId: string;
  providerKind: 'empty' | 'static' | 'api';
  // Step 0 keeps the imagery seam synchronous and minimal. Future loading behavior
  // can change behind this boundary once approved assets exist.
  getEarthTextureSet(): EarthTextureSet | null;
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
    getEarthTextureSet() {
      // Step 5 keeps static imagery provider state immutable so appearance policy
      // and asset metadata stay a provider concern instead of being mutated in-scene.
      return stableTextureSet;
    },
  };
}
