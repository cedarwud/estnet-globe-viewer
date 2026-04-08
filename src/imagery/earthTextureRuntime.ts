import {
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  SRGBColorSpace,
  Texture,
} from 'three';
import {
  resolveEarthTextureAnisotropy,
  type EarthAppearanceProfile,
} from './earthAppearance';

export function configureEarthRuntimeTexture(
  texture: Texture,
  rendererMaxAnisotropy: number,
  appearanceProfile: EarthAppearanceProfile
) {
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = resolveEarthTextureAnisotropy(
    rendererMaxAnisotropy,
    appearanceProfile
  );
  texture.needsUpdate = true;
  return texture;
}
