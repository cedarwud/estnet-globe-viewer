import { BackSide } from 'three';
import type {
  ServiceAvailabilityTruth,
  ServiceSelectionTruth,
  WorldGeometryTruth,
} from '../../truth/contracts';
import type { EarthTextureSet } from '../../imagery/provider';
import {
  EarthDayNightSurface,
  EarthDaySurface,
  PlaceholderEarthSurface,
} from './EarthSurface';
import { EndpointAnchor } from './EndpointAnchor';
import { GlobeGraticule } from './GlobeGraticule';
import { SatelliteMarker } from './SatelliteMarker';
import { ServiceCorridorOverlay } from './ServiceCorridorOverlay';

interface HeroGlobeProps {
  earthTextures: EarthTextureSet | null;
  sunDirection: [number, number, number];
  worldGeometry: WorldGeometryTruth;
  serviceAvailability: ServiceAvailabilityTruth;
  serviceSelection: ServiceSelectionTruth;
}

export const GLOBE_RADIUS = 1.8;

export function HeroGlobe({
  earthTextures,
  sunDirection,
  worldGeometry,
  serviceAvailability,
  serviceSelection,
}: HeroGlobeProps) {
  const usesPlaceholderSurface =
    earthTextures?.availability !== 'approved-runtime' || earthTextures.dayTextureUrl === null;
  const usesDayNightShader =
    !usesPlaceholderSurface && earthTextures?.nightTextureUrl !== null;
  const activeRelayIds = new Set(
    serviceSelection.kind === 'supported' && serviceSelection.activePath
      ? serviceSelection.activePath.relaySatelliteIds
      : []
  );

  return (
    <group>
      {/* Step 2 promotes the main path to a controlled day/night shader.
          If the approved night derivative is unavailable, fall back to the Step 1
          day-only surface instead of masking the issue with extra fill light. */}
      {usesPlaceholderSurface || !earthTextures?.dayTextureUrl ? (
        <PlaceholderEarthSurface radius={GLOBE_RADIUS} />
      ) : usesDayNightShader && earthTextures.nightTextureUrl ? (
        <EarthDayNightSurface
          radius={GLOBE_RADIUS}
          dayTextureUrl={earthTextures.dayTextureUrl}
          nightTextureUrl={earthTextures.nightTextureUrl}
          sunDirection={sunDirection}
        />
      ) : (
        <EarthDaySurface radius={GLOBE_RADIUS} dayTextureUrl={earthTextures.dayTextureUrl} />
      )}

      <mesh scale={1.018}>
        <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
        <meshBasicMaterial
          color="#8fc9ef"
          transparent
          opacity={0.045}
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
