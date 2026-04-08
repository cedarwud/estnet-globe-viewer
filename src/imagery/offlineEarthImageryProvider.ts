import { createStaticImageryProvider } from './provider';

export const offlineEarthImageryProvider = createStaticImageryProvider({
  providerId: 'offline-earth-imagery-step-0',
  providerKind: 'empty',
  textureSet: {
    availability: 'none-approved',
    dayTextureUrl: null,
    dayAssetId: null,
    governanceDocPath: 'docs/assets/earth-assets.md',
    note: 'Step 0 lands the imagery seam and asset governance only. No reviewed runtime Earth texture is committed yet, so the scene must stay on the placeholder globe until Step 1 approves a day derivative.',
  },
});
