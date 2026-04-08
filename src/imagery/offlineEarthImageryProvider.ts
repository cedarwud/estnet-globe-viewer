import { createStaticImageryProvider } from './provider';

export const offlineEarthImageryProvider = createStaticImageryProvider({
  providerId: 'offline-earth-imagery-step-2',
  providerKind: 'static',
  textureSet: {
    availability: 'approved-runtime',
    dayTextureUrl: '/assets/earth/earth-day-nasa-blue-marble-ng-4096x2048.webp',
    dayAssetId: 'earth-day-nasa-blue-marble-ng-4096x2048-webp',
    nightTextureUrl: '/assets/earth/earth-night-nasa-black-marble-2016-4096x2048.webp',
    nightAssetId: 'earth-night-nasa-black-marble-2016-4096x2048-webp',
    governanceDocPath: 'docs/assets/earth-assets.md',
    note: 'Step 2 keeps the approved NASA day baseline and adds a reviewed Black Marble night derivative. The main path now uses a controlled day-night shader with an explicit sunDirection boundary, while clouds, atmosphere, and bloom remain outside the runtime scope.',
  },
});
