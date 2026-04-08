import { createStaticImageryProvider } from './provider';

export const offlineEarthImageryProvider = createStaticImageryProvider({
  providerId: 'offline-earth-imagery-step-1',
  providerKind: 'static',
  textureSet: {
    availability: 'approved-runtime',
    dayTextureUrl: '/assets/earth/earth-day-nasa-blue-marble-ng-4096x2048.webp',
    dayAssetId: 'earth-day-nasa-blue-marble-ng-4096x2048-webp',
    governanceDocPath: 'docs/assets/earth-assets.md',
    note: 'Step 1 promotes a reviewed NASA Blue Marble day derivative into the offline baseline. The Earth surface is now texture-backed, while dark-side treatment remains intentionally deferred to Step 2.',
  },
});
