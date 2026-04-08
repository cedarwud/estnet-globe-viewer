import { createStaticImageryProvider } from './provider';

export const offlineEarthImageryProvider = createStaticImageryProvider({
  providerId: 'offline-earth-imagery-step-6',
  providerKind: 'static',
  textureSet: {
    availability: 'approved-runtime',
    dayTextureUrl: '/assets/earth/earth-day-nasa-blue-marble-ng-4096x2048.webp',
    dayAssetId: 'earth-day-nasa-blue-marble-ng-4096x2048-webp',
    nightTextureUrl: '/assets/earth/earth-night-nasa-black-marble-2016-4096x2048.webp',
    nightAssetId: 'earth-night-nasa-black-marble-2016-4096x2048-webp',
    cloudTextureUrl: '/assets/earth/earth-clouds-nasa-blue-marble-2002-4096x2048.webp',
    cloudAssetId: 'earth-clouds-nasa-blue-marble-2002-4096x2048-webp',
    appearanceProfileId: 'offline-balanced-v2',
    textureQuality: 'runtime-4k-webp',
    governanceDocPath: 'docs/assets/earth-assets.md',
    note: 'Commit 2 keeps the approved NASA day/night WebP derivatives, adds an approved NASA GSFC cloud derivative, and layers a restrained cloud shell between the Earth surface and atmosphere. The runtime path remains repo-safe WebP only; bloom, weather animation, ocean specular, grading, and KTX2 stay deferred.',
  },
});
