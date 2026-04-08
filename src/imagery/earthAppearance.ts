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

export interface EarthSurfaceGradingAppearanceConfig {
  dayContrast: number;
  daySaturation: number;
  dayLift: number;
  landWarmth: number;
  oceanTintStrength: number;
  nightSaturation: number;
  twilightBlueMix: number;
}

export interface EarthOceanAppearanceConfig {
  maskThreshold: number;
  maskSoftness: number;
  specularStrength: number;
  specularSharpness: number;
  fresnelStrength: number;
  cloudOcclusionStrength: number;
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
  surfaceGrading: EarthSurfaceGradingAppearanceConfig;
  ocean: EarthOceanAppearanceConfig;
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
  surfaceGrading: {
    dayContrast: 1,
    daySaturation: 1,
    dayLift: 0,
    landWarmth: 0,
    oceanTintStrength: 0,
    nightSaturation: 1,
    twilightBlueMix: 0.35,
  },
  ocean: {
    maskThreshold: 0.04,
    maskSoftness: 0.09,
    specularStrength: 0,
    specularSharpness: 92,
    fresnelStrength: 0,
    cloudOcclusionStrength: 0,
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

export const offlineBalancedEarthAppearanceProfileV3: EarthAppearanceProfile = {
  ...offlineBalancedEarthAppearanceProfileV2,
  id: 'offline-balanced-v3',
  label: 'Offline Balanced Earth v3',
  surfaceGrading: {
    dayContrast: 1.06,
    daySaturation: 1.05,
    dayLift: 0.018,
    landWarmth: 0.085,
    oceanTintStrength: 0.28,
    nightSaturation: 0.82,
    twilightBlueMix: 0.42,
  },
  ocean: {
    maskThreshold: 0.036,
    maskSoftness: 0.11,
    specularStrength: 0.18,
    specularSharpness: 70,
    fresnelStrength: 0.09,
    cloudOcclusionStrength: 0.56,
  },
  clouds: {
    ...offlineBalancedEarthAppearanceProfileV2.clouds,
    opacity: 0.43,
    dayBoost: 0.84,
    nightFloor: 0.028,
  },
};

const EARTH_APPEARANCE_PROFILES: Record<EarthAppearanceProfileId, EarthAppearanceProfile> = {
  'offline-balanced-v1': offlineBalancedEarthAppearanceProfile,
  'offline-balanced-v2': offlineBalancedEarthAppearanceProfileV2,
  'offline-balanced-v3': offlineBalancedEarthAppearanceProfileV3,
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
