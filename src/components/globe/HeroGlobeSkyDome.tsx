import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import {
  BackSide,
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';

const HERO_SKY_TEXTURE_URL = '/assets/sky/home-globe-sky-eso-milky-way-panorama.webp';
const HERO_SKY_DOME_RADIUS = 92;
const HERO_SKY_DOME_ROTATION: [number, number, number] = [0.56, 1.34, 0.62];
const HERO_SKY_DOME_ANISOTROPY_CAP = 4;

export function HeroGlobeSkyDome() {
  const skyDomeRef = useRef<Mesh | null>(null);
  const skyTexture = useTexture(HERO_SKY_TEXTURE_URL);
  const { camera, gl } = useThree();
  const configuredTexture = useMemo(() => {
    skyTexture.colorSpace = SRGBColorSpace;
    skyTexture.wrapS = RepeatWrapping;
    skyTexture.wrapT = ClampToEdgeWrapping;
    skyTexture.repeat.x = -1;
    skyTexture.offset.x = 1;
    skyTexture.minFilter = LinearMipmapLinearFilter;
    skyTexture.magFilter = LinearFilter;
    skyTexture.anisotropy = Math.min(
      gl.capabilities.getMaxAnisotropy(),
      HERO_SKY_DOME_ANISOTROPY_CAP
    );
    skyTexture.needsUpdate = true;
    return skyTexture;
  }, [gl, skyTexture]);

  useFrame(() => {
    // Keep the sky centered on the camera so it reads as distant space rather
    // than a nearby shell locked to the globe itself.
    skyDomeRef.current?.position.copy(camera.position);
  });

  return (
    <mesh
      ref={skyDomeRef}
      frustumCulled={false}
      renderOrder={-20}
      rotation={HERO_SKY_DOME_ROTATION}
    >
      <sphereGeometry args={[HERO_SKY_DOME_RADIUS, 40, 28]} />
      <meshBasicMaterial
        color="#aeb6c5"
        depthTest={false}
        depthWrite={false}
        fog={false}
        map={configuredTexture}
        side={BackSide}
        toneMapped={false}
      />
    </mesh>
  );
}
