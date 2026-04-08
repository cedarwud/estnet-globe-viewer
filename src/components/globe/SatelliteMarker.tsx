import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, Mesh } from 'three';
import { Color } from 'three';
import { geoCoordinateToScenePosition } from '../../lib/geo';
import type { SatelliteGeometryTruth } from '../../truth/contracts';

interface SatelliteMarkerProps {
  satellite: SatelliteGeometryTruth;
  globeRadius: number;
  state: 'active' | 'candidate';
}

const SATELLITE_STYLE = {
  active: {
    color: '#8ed2ff',
    size: 0.082,
    haloInner: 0.118,
    haloOuter: 0.168,
    opacity: 0.5,
  },
  candidate: {
    color: '#c2c8d1',
    size: 0.05,
    haloInner: 0.082,
    haloOuter: 0.118,
    opacity: 0.16,
  },
} as const;

export function SatelliteMarker({ satellite, globeRadius, state }: SatelliteMarkerProps) {
  const pulseRef = useRef<Group>(null);
  const haloRef = useRef<Mesh>(null);
  const style = SATELLITE_STYLE[state];
  const position = geoCoordinateToScenePosition(satellite.position, globeRadius);
  const baseScale = state === 'active' ? 1.08 : 0.94;

  useFrame(({ clock }) => {
    const cycle = (clock.getElapsedTime() * (state === 'active' ? 0.4 : 0.24)) % 1;

    if (pulseRef.current) {
      pulseRef.current.scale.setScalar(baseScale + cycle * 0.42);
    }

    const material = haloRef.current?.material;
    if (material && !Array.isArray(material) && 'opacity' in material) {
      material.opacity = style.opacity * (1 - cycle * 0.72);
    }
  });

  return (
    <group position={position.toArray()}>
      <mesh>
        <octahedronGeometry args={[style.size, 0]} />
        <meshStandardMaterial
          color={style.color}
          emissive={new Color(style.color).multiplyScalar(state === 'active' ? 0.62 : 0.18)}
          emissiveIntensity={1}
          roughness={0.22}
          metalness={0.16}
        />
      </mesh>

      <Billboard follow>
        <mesh>
          <ringGeometry args={[style.haloInner, style.haloOuter, 48]} />
          <meshBasicMaterial
            color={style.color}
            transparent
            opacity={style.opacity}
            depthWrite={false}
          />
        </mesh>

        <group ref={pulseRef}>
          <mesh ref={haloRef}>
            <ringGeometry args={[style.haloOuter + 0.02, style.haloOuter + 0.045, 48]} />
            <meshBasicMaterial
              color={style.color}
              transparent
              opacity={style.opacity * 0.7}
              depthWrite={false}
            />
          </mesh>
        </group>
      </Billboard>
    </group>
  );
}
