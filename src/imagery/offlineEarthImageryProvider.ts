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
    appearanceProfileId: 'offline-balanced-v3',
    textureQuality: 'runtime-4k-webp',
    governanceDocPath: 'docs/assets/earth-assets.md',
    note: 'Commit 3 keeps the approved NASA day/night/cloud WebP derivatives, adds restrained ocean/specular and a controlled Earth grading pass, and stays inside the same repo-safe imagery seam. No new runtime asset intake, bloom, weather animation, provider expansion, or KTX2 path is introduced here.',
  },
});
