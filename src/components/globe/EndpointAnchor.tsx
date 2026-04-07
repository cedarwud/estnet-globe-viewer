import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, Mesh } from 'three';
import { Color } from 'three';
import type { PlaceholderEndpoint } from '../../data/placeholderEndpoints';
import { latLonToSpherePosition } from '../../lib/geo';

interface EndpointAnchorProps {
  endpoint: PlaceholderEndpoint;
  globeRadius: number;
}

export function EndpointAnchor({ endpoint, globeRadius }: EndpointAnchorProps) {
  const pulseGroupRef = useRef<Group>(null);
  const pulseMeshRef = useRef<Mesh>(null);
  const markerPosition = latLonToSpherePosition(endpoint.latitudeDeg, endpoint.longitudeDeg, globeRadius, 0.045);
  const phaseOffset = endpoint.id === 'endpoint-alpha' ? 0 : 0.4;

  useFrame(({ clock }) => {
    const cycle = (clock.getElapsedTime() * 0.28 + phaseOffset) % 1;
    const scale = 1 + cycle * 0.95;

    if (pulseGroupRef.current) {
      pulseGroupRef.current.scale.setScalar(scale);
    }

    const material = pulseMeshRef.current?.material;
    if (material && !Array.isArray(material) && 'opacity' in material) {
      material.opacity = 0.36 * (1 - cycle);
    }
  });

  return (
    <>
      <mesh position={markerPosition}>
        <sphereGeometry args={[0.038, 24, 24]} />
        <meshStandardMaterial
          color={endpoint.color}
          emissive={new Color(endpoint.color).multiplyScalar(0.42)}
          emissiveIntensity={1}
          roughness={0.28}
        />
      </mesh>

      <Billboard position={markerPosition} follow>
        <mesh>
          <ringGeometry args={[0.07, 0.095, 48]} />
          <meshBasicMaterial
            color={endpoint.color}
            transparent
            opacity={0.48}
            depthWrite={false}
          />
        </mesh>

        <group ref={pulseGroupRef}>
          <mesh ref={pulseMeshRef}>
            <ringGeometry args={[0.11, 0.132, 48]} />
            <meshBasicMaterial
              color={endpoint.color}
              transparent
              opacity={0.24}
              depthWrite={false}
            />
          </mesh>
        </group>
      </Billboard>
    </>
  );
}
