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
  dayNight: {
    twilightWidth: 0.09,
    nightFloor: 0.012,
    nightIntensity: 0.075,
    twilightBoost: 0.024,
  },
  surfaceGrading: {
    dayContrast: 1.05,
    daySaturation: 1.04,
    dayLift: 0.034,
    landWarmth: 0.035,
    oceanTintStrength: 0.3,
    nightSaturation: 0.6,
    twilightBlueMix: 0.1,
  },
  ocean: {
    maskThreshold: 0.03,
    maskSoftness: 0.13,
    specularStrength: 0.28,
    specularSharpness: 58,
    fresnelStrength: 0.15,
    cloudOcclusionStrength: 0.46,
  },
  clouds: {
    ...offlineBalancedEarthAppearanceProfileV2.clouds,
    opacity: 0.14,
    dayBoost: 0.98,
    nightFloor: 0.002,
  },
  atmosphere: {
    ...offlineBalancedEarthAppearanceProfileV2.atmosphere,
    intensity: 0.22,
    dayColor: '#8ec7ff',
    twilightColor: '#d5e8ff',
  },
};

export const googleSatelliteHomeEarthAppearanceProfile: EarthAppearanceProfile = {
  ...offlineBalancedEarthAppearanceProfileV3,
  id: 'google-satellite-home-v1',
  label: 'Google Satellite Home v1',
  textureQuality: 'runtime-google-satellite-composite',
  surfaceSegments: 84,
  textureAnisotropyCap: 8,
  dayNight: {
    twilightWidth: 0.078,
    nightFloor: 0.006,
    nightIntensity: 0.022,
    twilightBoost: 0.016,
  },
  surfaceGrading: {
    dayContrast: 1.05,
    daySaturation: 1.06,
    dayLift: 0.046,
    landWarmth: 0.028,
    oceanTintStrength: 0.36,
    nightSaturation: 0.54,
    twilightBlueMix: 0.1,
  },
  ocean: {
    ...offlineBalancedEarthAppearanceProfileV3.ocean,
    maskThreshold: 0.025,
    maskSoftness: 0.16,
    specularStrength: 0.34,
    specularSharpness: 48,
    fresnelStrength: 0.2,
    cloudOcclusionStrength: 0.38,
  },
  clouds: {
    ...offlineBalancedEarthAppearanceProfileV3.clouds,
    opacity: 0.035,
    dayBoost: 0.9,
    nightFloor: 0.001,
  },
  atmosphere: {
    ...offlineBalancedEarthAppearanceProfileV3.atmosphere,
    intensity: 0.2,
    dayColor: '#92ccff',
    twilightColor: '#e0f0ff',
  },
};

export const offlineBalancedEarthAppearanceProfileV4: EarthAppearanceProfile = {
  ...offlineBalancedEarthAppearanceProfileV3,
  id: 'offline-balanced-v4',
  label: 'Offline Balanced Earth v4',
  surfaceSegments: 96,
  textureAnisotropyCap: 10,
  dayNight: {
    twilightWidth: 0.12,
    nightFloor: 0.025,
    nightIntensity: 0.55,
    twilightBoost: 0.035,
  },
  surfaceGrading: {
    dayContrast: 1.08,
    daySaturation: 1.06,
    dayLift: 0.038,
    landWarmth: 0.05,
    oceanTintStrength: 0.35,
    nightSaturation: 0.65,
    twilightBlueMix: 0.14,
  },
  ocean: {
    maskThreshold: 0.03,
    maskSoftness: 0.13,
    specularStrength: 0.36,
    specularSharpness: 52,
    fresnelStrength: 0.22,
    cloudOcclusionStrength: 0.48,
  },
  clouds: {
    ...offlineBalancedEarthAppearanceProfileV3.clouds,
    opacity: 0.22,
    dayBoost: 1.0,
    nightFloor: 0.003,
  },
  atmosphere: {
    ...offlineBalancedEarthAppearanceProfileV3.atmosphere,
    intensity: 0.28,
  },
};

export const googleSatelliteHomeEarthAppearanceProfileV2: EarthAppearanceProfile = {
  ...offlineBalancedEarthAppearanceProfileV4,
  id: 'google-satellite-home-v2',
  label: 'Google Satellite Home v2',
  textureQuality: 'runtime-google-satellite-composite',
  dayNight: {
    twilightWidth: 0.10,
    nightFloor: 0.018,
    nightIntensity: 0.45,
    twilightBoost: 0.028,
  },
  surfaceGrading: {
    dayContrast: 1.06,
    daySaturation: 1.07,
    dayLift: 0.046,
    landWarmth: 0.04,
    oceanTintStrength: 0.38,
    nightSaturation: 0.6,
    twilightBlueMix: 0.12,
  },
  ocean: {
    maskThreshold: 0.025,
    maskSoftness: 0.16,
    specularStrength: 0.38,
    specularSharpness: 44,
    fresnelStrength: 0.24,
    cloudOcclusionStrength: 0.42,
  },
  clouds: {
    ...offlineBalancedEarthAppearanceProfileV4.clouds,
    opacity: 0.06,
    dayBoost: 0.95,
    nightFloor: 0.002,
  },
  atmosphere: {
    ...offlineBalancedEarthAppearanceProfileV4.atmosphere,
    intensity: 0.25,
    dayColor: '#92ccff',
    twilightColor: '#e0f0ff',
  },
};

/**
 * V5 offline profile — Round V1 shared visible uplift.
 *
 * Changes versus V4:
 * - dayContrast 1.08 → 1.12: stronger tonal separation on day side
 * - daySaturation 1.06 → 1.12: land greens and desert tans read richer
 * - dayLift 0.038 → 0.052: shadow regions no longer sink into dark gray
 * - landWarmth 0.05 → 0.07: warmer continental hue, away from "flat photo" feel
 * - oceanTintStrength 0.35 → 0.42: oceans read bluer, not gray-green
 * - specularStrength 0.36 → 0.42: ocean glint more visible from home distance
 * - specularSharpness 52 → 62: tighter highlight, reads as water surface
 * - fresnelStrength 0.22 → 0.28: stronger limb brightening on ocean
 * - cloud opacity 0.22 → 0.30: clouds present enough to read as atmosphere
 * - cloud dayBoost 1.0 → 1.05: brighter cloud surfaces on day side
 * - atmosphere intensity 0.28 → 0.34: visible planetary rim from home distance
 */
export const offlineBalancedEarthAppearanceProfileV5: EarthAppearanceProfile = {
  ...offlineBalancedEarthAppearanceProfileV4,
  id: 'offline-balanced-v5',
  label: 'Offline Balanced Earth v5',
  dayNight: {
    twilightWidth: 0.12,
    nightFloor: 0.022,
    nightIntensity: 0.55,
    twilightBoost: 0.04,
  },
  surfaceGrading: {
    dayContrast: 1.12,
    daySaturation: 1.12,
    dayLift: 0.052,
    landWarmth: 0.07,
    oceanTintStrength: 0.42,
    nightSaturation: 0.65,
    twilightBlueMix: 0.16,
  },
  ocean: {
    maskThreshold: 0.03,
    maskSoftness: 0.13,
    specularStrength: 0.42,
    specularSharpness: 62,
    fresnelStrength: 0.28,
    cloudOcclusionStrength: 0.48,
  },
  clouds: {
    ...offlineBalancedEarthAppearanceProfileV4.clouds,
    opacity: 0.30,
    dayBoost: 1.05,
    nightFloor: 0.004,
  },
  atmosphere: {
    ...offlineBalancedEarthAppearanceProfileV4.atmosphere,
    intensity: 0.34,
    dayColor: '#8ec7ff',
  },
};

/**
 * V3 Google satellite profile — Round V1 shared visible uplift.
 * Matches the V5 offline direction so both modes present same product meaning.
 */
export const googleSatelliteHomeEarthAppearanceProfileV3: EarthAppearanceProfile = {
  ...offlineBalancedEarthAppearanceProfileV5,
  id: 'google-satellite-home-v3',
  label: 'Google Satellite Home v3',
  textureQuality: 'runtime-google-satellite-composite',
  dayNight: {
    twilightWidth: 0.10,
    nightFloor: 0.016,
    nightIntensity: 0.45,
    twilightBoost: 0.032,
  },
  surfaceGrading: {
    dayContrast: 1.10,
    daySaturation: 1.12,
    dayLift: 0.054,
    landWarmth: 0.05,
    oceanTintStrength: 0.44,
    nightSaturation: 0.6,
    twilightBlueMix: 0.14,
  },
  ocean: {
    maskThreshold: 0.025,
    maskSoftness: 0.16,
    specularStrength: 0.44,
    specularSharpness: 56,
    fresnelStrength: 0.30,
    cloudOcclusionStrength: 0.42,
  },
  clouds: {
    ...offlineBalancedEarthAppearanceProfileV5.clouds,
    opacity: 0.10,
    dayBoost: 1.0,
    nightFloor: 0.002,
  },
  atmosphere: {
    ...offlineBalancedEarthAppearanceProfileV5.atmosphere,
    intensity: 0.30,
    dayColor: '#92ccff',
    twilightColor: '#e0f0ff',
  },
};

const EARTH_APPEARANCE_PROFILES: Record<EarthAppearanceProfileId, EarthAppearanceProfile> = {
  'offline-balanced-v1': offlineBalancedEarthAppearanceProfile,
  'offline-balanced-v2': offlineBalancedEarthAppearanceProfileV2,
  'offline-balanced-v3': offlineBalancedEarthAppearanceProfileV3,
  'offline-balanced-v4': offlineBalancedEarthAppearanceProfileV4,
  'offline-balanced-v5': offlineBalancedEarthAppearanceProfileV5,
  'google-satellite-home-v1': googleSatelliteHomeEarthAppearanceProfile,
  'google-satellite-home-v2': googleSatelliteHomeEarthAppearanceProfileV2,
  'google-satellite-home-v3': googleSatelliteHomeEarthAppearanceProfileV3,
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
