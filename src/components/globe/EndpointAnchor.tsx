import { Billboard, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, Mesh } from 'three';
import { Color, Vector3 } from 'three';
import { latLonToSpherePosition } from '../../lib/geo';
import type { EndpointGeometryTruth } from '../../truth/contracts';

interface EndpointAnchorProps {
  endpoint: EndpointGeometryTruth;
  globeRadius: number;
}

export function EndpointAnchor({ endpoint, globeRadius }: EndpointAnchorProps) {
  const pulseGroupRef = useRef<Group>(null);
  const pulseMeshRef = useRef<Mesh>(null);
  const labelGroupRef = useRef<Group>(null);
  const sceneLabel = endpoint.label.startsWith('Endpoint ')
    ? endpoint.label.slice('Endpoint '.length)
    : endpoint.label;
  const markerPosition = latLonToSpherePosition(
    endpoint.position.latitudeDeg,
    endpoint.position.longitudeDeg,
    globeRadius,
    0.045
  );
  const markerDirection = new Vector3(...markerPosition).normalize();
  const phaseOffset = endpoint.id === 'endpoint-alpha' ? 0 : 0.4;

  useFrame(({ camera, clock }) => {
    const cycle = (clock.getElapsedTime() * 0.28 + phaseOffset) % 1;
    const scale = 1 + cycle * 0.95;

    if (pulseGroupRef.current) {
      pulseGroupRef.current.scale.setScalar(scale);
    }

    const material = pulseMeshRef.current?.material;
    if (material && !Array.isArray(material) && 'opacity' in material) {
      material.opacity = 0.36 * (1 - cycle);
    }

    if (labelGroupRef.current) {
      const facingDot = camera.position.clone().normalize().dot(markerDirection);
      labelGroupRef.current.visible = facingDot > 0.02;
    }
  });

  return (
    <>
      <mesh position={markerPosition}>
        <sphereGeometry args={[0.046, 28, 28]} />
        <meshStandardMaterial
          color={endpoint.accentColor}
          emissive={new Color(endpoint.accentColor).multiplyScalar(0.48)}
          emissiveIntensity={1}
          roughness={0.24}
        />
      </mesh>

      <Billboard position={markerPosition} follow>
        <mesh>
          <ringGeometry args={[0.082, 0.112, 48]} />
          <meshBasicMaterial
            color={endpoint.accentColor}
            transparent
            opacity={0.58}
            depthWrite={false}
          />
        </mesh>

        <group ref={pulseGroupRef}>
          <mesh ref={pulseMeshRef}>
            <ringGeometry args={[0.126, 0.15, 48]} />
            <meshBasicMaterial
              color={endpoint.accentColor}
              transparent
              opacity={0.24}
              depthWrite={false}
            />
          </mesh>
        </group>
      </Billboard>

      <Billboard position={markerPosition} follow>
        <group
          ref={labelGroupRef}
          position={[
            endpoint.id === 'endpoint-alpha' ? -0.22 : 0.22,
            endpoint.id === 'endpoint-alpha' ? -0.16 : 0.18,
            0,
          ]}
        >
          <Html
            transform
            sprite
            occlude={false}
            distanceFactor={7.5}
          >
            <div
              className="endpoint-scene-label"
              style={{
                borderColor: endpoint.accentColor,
                boxShadow: `0 0 0 1px ${endpoint.accentColor}22`,
              }}
            >
              {sceneLabel}
            </div>
          </Html>
        </group>
      </Billboard>
    </>
  );
}
