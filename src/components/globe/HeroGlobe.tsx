import { BackSide, Color } from 'three';
import type { PlaceholderEndpoint } from '../../data/placeholderEndpoints';
import { EndpointAnchor } from './EndpointAnchor';
import { GlobeGraticule } from './GlobeGraticule';

interface HeroGlobeProps {
  endpoints: PlaceholderEndpoint[];
}

const GLOBE_RADIUS = 1.8;

export function HeroGlobe({ endpoints }: HeroGlobeProps) {
  return (
    <group rotation={[0.16, -0.72, 0.08]}>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
        <meshStandardMaterial
          color="#0f223a"
          emissive={new Color('#1f466d')}
          emissiveIntensity={0.34}
          roughness={0.84}
          metalness={0.08}
        />
      </mesh>

      <mesh scale={1.035}>
        <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
        <meshBasicMaterial
          color="#3eb0ff"
          transparent
          opacity={0.08}
          side={BackSide}
          depthWrite={false}
        />
      </mesh>

      <GlobeGraticule radius={GLOBE_RADIUS + 0.004} />

      {endpoints.map((endpoint) => (
        <EndpointAnchor
          key={endpoint.id}
          endpoint={endpoint}
          globeRadius={GLOBE_RADIUS}
        />
      ))}
    </group>
  );
}
