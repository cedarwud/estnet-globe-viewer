import { createStaticImageryProvider } from './provider';

export const offlineEarthImageryProvider = createStaticImageryProvider({
  providerId: 'offline-earth-imagery-step-7',
  providerKind: 'static',
  textureSet: {
    availability: 'approved-runtime',
    dayTextureUrl: '/assets/earth/earth-day-nasa-blue-marble-ng-4096x2048.webp',
    dayAssetId: 'earth-day-nasa-blue-marble-ng-4096x2048-webp',
    nightTextureUrl: '/assets/earth/earth-night-nasa-black-marble-2016-4096x2048.webp',
    nightAssetId: 'earth-night-nasa-black-marble-2016-4096x2048-webp',
    cloudTextureUrl: '/assets/earth/earth-clouds-nasa-blue-marble-2002-4096x2048.webp',
    cloudAssetId: 'earth-clouds-nasa-blue-marble-2002-4096x2048-webp',
    appearanceProfileId: 'offline-balanced-v5',
    textureQuality: 'runtime-4k-webp',
    governanceDocPath: 'docs/assets/earth-assets.md',
    note: 'Round 2 shared baseline lift: same approved NASA day/night/cloud WebP derivatives, upgraded appearance profile with proper day/night terminator, visible city lights on the dark hemisphere, limb darkening, higher surface segments (96) and anisotropy (10), richer color grading and ocean specular. No new assets, no API-only behavior, no focus-detail region.',
  },
});
