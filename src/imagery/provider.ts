export interface EarthTextureSet {
  availability: 'none-approved' | 'approved-runtime';
  dayTextureUrl: string | null;
  dayAssetId: string | null;
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
  return {
    providerId: config.providerId,
    providerKind: config.providerKind,
    getEarthTextureSet() {
      return config.textureSet;
    },
  };
}
