import type {
  EarthAppearanceProfileId,
  EarthTextureQuality,
  EarthTextureSet,
} from './provider';

export interface EarthDayNightAppearanceConfig {
  twilightWidth: number;
  nightFloor: number;
  nightIntensity: number;
  twilightBoost: number;
}

export interface EarthAtmosphereAppearanceConfig {
  shellScale: number;
  rimPower: number;
  intensity: number;
  dayColor: string;
  twilightColor: string;
}

export interface EarthCloudAppearanceConfig {
  shellScale: number;
  rotationDeg: number;
  opacity: number;
  densityThreshold: number;
  densitySoftness: number;
  dayBoost: number;
  nightFloor: number;
  limbFadeExponent: number;
}

export interface EarthAppearanceProfile {
  id: EarthAppearanceProfileId;
  label: string;
  textureQuality: EarthTextureQuality;
  surfaceSegments: number;
  textureAnisotropyCap: number;
  dayNight: EarthDayNightAppearanceConfig;
  clouds: EarthCloudAppearanceConfig;
  atmosphere: EarthAtmosphereAppearanceConfig;
}

export const offlineBalancedEarthAppearanceProfile: EarthAppearanceProfile = {
  id: 'offline-balanced-v1',
  label: 'Offline Balanced Earth v1',
  textureQuality: 'runtime-4k-webp',
  // Step 5 hardens the runtime path by centralizing quality choices here instead
  // of scattering them through the scene graph. Future quality swaps stay behind
  // this appearance boundary rather than rewriting HeroGlobe logic.
  surfaceSegments: 80,
  textureAnisotropyCap: 6,
  dayNight: {
    twilightWidth: 0.18,
    nightFloor: 0.028,
    nightIntensity: 0.92,
    twilightBoost: 0.18,
  },
  clouds: {
    shellScale: 1.01,
    rotationDeg: 0,
    opacity: 0,
    densityThreshold: 0.34,
    densitySoftness: 0.18,
    dayBoost: 0.82,
    nightFloor: 0.06,
    limbFadeExponent: 0.9,
  },
  atmosphere: {
    shellScale: 1.032,
    rimPower: 3.6,
    intensity: 0.38,
    dayColor: '#7fb6ff',
    twilightColor: '#b8d8ff',
  },
};

export const offlineBalancedEarthAppearanceProfileV2: EarthAppearanceProfile = {
  ...offlineBalancedEarthAppearanceProfile,
  id: 'offline-balanced-v2',
  label: 'Offline Balanced Earth v2',
  clouds: {
    shellScale: 1.011,
    rotationDeg: 0,
    opacity: 0.46,
    densityThreshold: 0.36,
    densitySoftness: 0.19,
    dayBoost: 0.86,
    nightFloor: 0.03,
    limbFadeExponent: 1.15,
  },
};

const EARTH_APPEARANCE_PROFILES: Record<EarthAppearanceProfileId, EarthAppearanceProfile> = {
  'offline-balanced-v1': offlineBalancedEarthAppearanceProfile,
  'offline-balanced-v2': offlineBalancedEarthAppearanceProfileV2,
};

export function resolveEarthAppearanceProfile(
  textureSet: Pick<EarthTextureSet, 'appearanceProfileId'> | null
) {
  if (!textureSet) {
    return offlineBalancedEarthAppearanceProfile;
  }

  return (
    EARTH_APPEARANCE_PROFILES[textureSet.appearanceProfileId] ??
    offlineBalancedEarthAppearanceProfile
  );
}

export function resolveEarthTextureAnisotropy(
  rendererMaxAnisotropy: number,
  profile: EarthAppearanceProfile
) {
  return Math.min(rendererMaxAnisotropy, profile.textureAnisotropyCap);
}
