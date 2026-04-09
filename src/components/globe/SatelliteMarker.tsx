import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Group, Material, Mesh, Object3D } from 'three';
import { Color } from 'three';
import type { SatelliteGeometryTruth } from '../../truth/contracts';
import {
  buildSatelliteVisualOrbitDescriptor,
  sampleSatelliteVisualOrbit,
} from './satelliteVisualMotion';

interface SatelliteMarkerProps {
  satellite: SatelliteGeometryTruth;
  globeRadius: number;
  state: 'active' | 'candidate';
}

const SATELLITE_MODEL_ASSET_PATH = '/assets/models/sat.glb';

const SATELLITE_STYLE = {
  active: {
    modelColor: '#d7f0ff',
    glowColor: '#8ed2ff',
    modelScale: 0.0118,
    size: 0.062,
    modelOpacity: 1,
    emissiveIntensity: 1.9,
    beaconRadius: 0.024,
    beaconOpacity: 0.86,
  },
  candidate: {
    modelColor: '#e9eff6',
    glowColor: '#d4dde6',
    modelScale: 0.0096,
    size: 0.05,
    modelOpacity: 0.98,
    emissiveIntensity: 1.15,
    beaconRadius: 0.016,
    beaconOpacity: 0.44,
  },
} as const;

const SATELLITE_MODEL_ROTATION: [number, number, number] = [0, Math.PI / 2, 0];

function tintSatelliteMaterial(material: Material, state: 'active' | 'candidate') {
  const style = SATELLITE_STYLE[state];
  const clonedMaterial = material.clone();
  const typedMaterial = clonedMaterial as Material & {
    color?: Color;
    emissive?: Color;
    emissiveIntensity?: number;
    transparent?: boolean;
    opacity?: number;
  };

  if (typedMaterial.color) {
    typedMaterial.color.set(style.modelColor);
  }

  if (typedMaterial.emissive) {
    typedMaterial.emissive.set(style.glowColor);
  }

  if (typeof typedMaterial.emissiveIntensity === 'number') {
    typedMaterial.emissiveIntensity = style.emissiveIntensity;
  }

  if (typeof typedMaterial.opacity === 'number') {
    typedMaterial.opacity = style.modelOpacity;
    typedMaterial.transparent = style.modelOpacity < 1;
  }

  return clonedMaterial;
}

function useSatelliteMotion(
  satellite: SatelliteGeometryTruth,
  globeRadius: number
) {
  const orbitAnchorRef = useRef<Group>(null);
  const orbitDescriptor = useMemo(
    () => buildSatelliteVisualOrbitDescriptor(satellite, globeRadius),
    [globeRadius, satellite]
  );

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    const motion = sampleSatelliteVisualOrbit(orbitDescriptor, elapsedTime);

    if (orbitAnchorRef.current) {
      orbitAnchorRef.current.position.copy(motion.scenePosition);
      orbitAnchorRef.current.up.copy(motion.radialDirection);
      orbitAnchorRef.current.lookAt(motion.scenePosition.clone().add(motion.travelDirection));
    }
  });

  return {
    orbitAnchorRef,
  };
}

export function SatelliteMarkerFallback({ satellite, globeRadius, state }: SatelliteMarkerProps) {
  const { orbitAnchorRef } = useSatelliteMotion(satellite, globeRadius);
  const style = SATELLITE_STYLE[state];

  return (
    <group ref={orbitAnchorRef}>
      <mesh>
        <octahedronGeometry args={[style.size, 0]} />
        <meshStandardMaterial
          color={style.glowColor}
          emissive={new Color(style.glowColor).multiplyScalar(state === 'active' ? 0.62 : 0.18)}
          emissiveIntensity={1}
          roughness={0.22}
          metalness={0.16}
        />
      </mesh>
    </group>
  );
}

export function SatelliteMarker({ satellite, globeRadius, state }: SatelliteMarkerProps) {
  const { scene } = useGLTF(SATELLITE_MODEL_ASSET_PATH);
  const { orbitAnchorRef } = useSatelliteMotion(satellite, globeRadius);
  const style = SATELLITE_STYLE[state];
  const tintedModelScene = useMemo(() => {
    const clonedScene = SkeletonUtils.clone(scene);

    clonedScene.traverse((object: Object3D) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) {
        return;
      }

      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((material) => tintSatelliteMaterial(material, state))
        : tintSatelliteMaterial(mesh.material, state);
    });

    return clonedScene;
  }, [scene, state]);

  return (
    <group ref={orbitAnchorRef}>
      <group
        rotation={SATELLITE_MODEL_ROTATION}
        scale={style.modelScale}
      >
        <primitive object={tintedModelScene} />
      </group>
      <mesh>
        <sphereGeometry args={[style.beaconRadius, 12, 12]} />
        <meshBasicMaterial
          color={style.glowColor}
          transparent
          opacity={style.beaconOpacity}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload(SATELLITE_MODEL_ASSET_PATH);
