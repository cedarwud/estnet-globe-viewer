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
  localInspectCueState?: 'discoverable' | 'echo' | null;
}

export function EndpointAnchor({
  endpoint,
  globeRadius,
  localInspectCueState = null,
}: EndpointAnchorProps) {
  const pulseGroupRef = useRef<Group>(null);
  const pulseMeshRef = useRef<Mesh>(null);
  const spotlightGroupRef = useRef<Group>(null);
  const labelGroupRef = useRef<Group>(null);
  const labelWorldPosition = new Vector3();
  const cameraDirection = new Vector3();
  const sceneLabel = endpoint.label.startsWith('Endpoint ')
    ? endpoint.label.slice('Endpoint '.length)
    : endpoint.label;
  const markerPosition = latLonToSpherePosition(
    endpoint.position.latitudeDeg,
    endpoint.position.longitudeDeg,
    globeRadius,
    0.045
  );
  const phaseOffset = endpoint.id === 'endpoint-alpha' ? 0 : 0.4;

  useFrame(({ camera, clock }) => {
    const cycle = (clock.getElapsedTime() * 0.28 + phaseOffset) % 1;
    const scale = 1 + cycle * 0.95;
    const spotlightScale = 1.04 + Math.sin(clock.getElapsedTime() * 2 + phaseOffset) * 0.08;

    if (pulseGroupRef.current) {
      pulseGroupRef.current.scale.setScalar(scale);
    }

    if (spotlightGroupRef.current) {
      spotlightGroupRef.current.scale.setScalar(spotlightScale);
    }

    const material = pulseMeshRef.current?.material;
    if (material && !Array.isArray(material) && 'opacity' in material) {
      material.opacity = 0.36 * (1 - cycle);
    }

    if (labelGroupRef.current) {
      labelGroupRef.current.getWorldPosition(labelWorldPosition);
      cameraDirection.copy(camera.position).normalize();
      const facingDot = cameraDirection.dot(labelWorldPosition.normalize());
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

      {localInspectCueState ? (
        <Billboard position={markerPosition} follow>
          <group ref={spotlightGroupRef}>
            <mesh>
              <ringGeometry args={[0.138, 0.164, 56]} />
              <meshBasicMaterial
                color={localInspectCueState === 'echo' ? '#ffbf69' : endpoint.accentColor}
                transparent
                opacity={localInspectCueState === 'echo' ? 0.32 : 0.16}
                depthWrite={false}
              />
            </mesh>
            <mesh>
              <ringGeometry args={[0.182, 0.202, 56]} />
              <meshBasicMaterial
                color={localInspectCueState === 'echo' ? '#ffd39b' : '#ffdfaa'}
                transparent
                opacity={localInspectCueState === 'echo' ? 0.12 : 0.045}
                depthWrite={false}
              />
            </mesh>
          </group>
        </Billboard>
      ) : null}

      <group
        ref={labelGroupRef}
        position={markerPosition}
      >
        <Html
          center
          occlude={false}
        >
          <div
            className="endpoint-scene-label endpoint-scene-label--above"
            style={{
              borderColor: endpoint.accentColor,
              boxShadow: `0 0 0 1px ${endpoint.accentColor}22`,
            }}
          >
            {sceneLabel}
          </div>
        </Html>
      </group>
    </>
  );
}
