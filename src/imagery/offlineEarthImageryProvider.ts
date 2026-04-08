import { createStaticImageryProvider } from './provider';

export const offlineEarthImageryProvider = createStaticImageryProvider({
  providerId: 'offline-earth-imagery-step-5',
  providerKind: 'static',
  textureSet: {
    availability: 'approved-runtime',
    dayTextureUrl: '/assets/earth/earth-day-nasa-blue-marble-ng-4096x2048.webp',
    dayAssetId: 'earth-day-nasa-blue-marble-ng-4096x2048-webp',
    nightTextureUrl: '/assets/earth/earth-night-nasa-black-marble-2016-4096x2048.webp',
    nightAssetId: 'earth-night-nasa-black-marble-2016-4096x2048-webp',
    appearanceProfileId: 'offline-balanced-v1',
    textureQuality: 'runtime-4k-webp',
    governanceDocPath: 'docs/assets/earth-assets.md',
    note: 'Step 5 keeps the approved NASA day/night WebP derivatives, adds a named appearance profile, and hardens the runtime path with capped anisotropy plus build chunk splitting. KTX2 remains deferred because the current two-asset WebP baseline is already repo-safe and does not yet justify a Basis/KTX2 pipeline plus fallback chain.',
  },
});
