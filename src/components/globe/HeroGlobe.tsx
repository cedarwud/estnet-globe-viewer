import { BackSide, Color } from 'three';
import type {
  ServiceAvailabilityTruth,
  ServiceSelectionTruth,
  WorldGeometryTruth,
} from '../../truth/contracts';
import type { EarthTextureSet } from '../../imagery/provider';
import { EndpointAnchor } from './EndpointAnchor';
import { GlobeGraticule } from './GlobeGraticule';
import { SatelliteMarker } from './SatelliteMarker';
import { ServiceCorridorOverlay } from './ServiceCorridorOverlay';

interface HeroGlobeProps {
  earthTextures: EarthTextureSet | null;
  worldGeometry: WorldGeometryTruth;
  serviceAvailability: ServiceAvailabilityTruth;
  serviceSelection: ServiceSelectionTruth;
}

export const GLOBE_RADIUS = 1.8;

export function HeroGlobe({
  earthTextures,
  worldGeometry,
  serviceAvailability,
  serviceSelection,
}: HeroGlobeProps) {
  const usesPlaceholderSurface =
    earthTextures?.availability !== 'approved-runtime' || earthTextures.dayTextureUrl === null;
  const activeRelayIds = new Set(
    serviceSelection.kind === 'supported' && serviceSelection.activePath
      ? serviceSelection.activePath.relaySatelliteIds
      : []
  );

  return (
    <group rotation={[0.16, -0.72, 0.08]}>
      {/* Step 0 only lands the imagery seam and governance boundary.
          Keep the placeholder globe explicit until Step 1 approves a real day texture. */}
      <mesh name={usesPlaceholderSurface ? 'earth-placeholder-surface' : 'earth-textured-surface'}>
        <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
        <meshStandardMaterial
          color="#0f223a"
          emissive={new Color('#1f466d')}
          emissiveIntensity={0.42}
          roughness={0.84}
          metalness={0.08}
        />
      </mesh>

      <mesh scale={1.035}>
        <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
        <meshBasicMaterial
          color="#3eb0ff"
          transparent
          opacity={0.11}
          side={BackSide}
          depthWrite={false}
        />
      </mesh>

      <GlobeGraticule radius={GLOBE_RADIUS + 0.004} />

      {worldGeometry.endpoints.map((endpoint) => (
        <EndpointAnchor
          key={endpoint.id}
          endpoint={endpoint}
          globeRadius={GLOBE_RADIUS}
        />
      ))}

      {/* WorldGeometryTruth is already filtered to service-relevant satellites in this baseline.
          Avoid expanding this into a full-constellation fallback, or the globe will lose legibility. */}
      {worldGeometry.satellites.map((satellite) => (
        <SatelliteMarker
          key={satellite.id}
          satellite={satellite}
          globeRadius={GLOBE_RADIUS}
          state={activeRelayIds.has(satellite.id) ? 'active' : 'candidate'}
        />
      ))}

      <ServiceCorridorOverlay
        worldGeometry={worldGeometry}
        serviceAvailability={serviceAvailability}
        serviceSelection={serviceSelection}
        globeRadius={GLOBE_RADIUS}
      />
    </group>
  );
}
