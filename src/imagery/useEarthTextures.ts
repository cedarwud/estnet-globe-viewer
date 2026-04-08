import { useMemo } from 'react';
import type { EarthTextureSet, ImageryProvider } from './provider';

export function useEarthTextures(provider: ImageryProvider): EarthTextureSet | null {
  return useMemo(() => provider.getEarthTextureSet(), [provider]);
}
