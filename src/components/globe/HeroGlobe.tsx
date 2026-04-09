import type {
  GeoCoordinate,
  ServiceAvailabilityTruth,
  ServiceSelectionTruth,
  WorldGeometryTruth,
} from '../../truth/contracts';
import type { EarthTextureSet } from '../../imagery/provider';
import {
  EarthAtmosphereShell,
  EarthCloudShell,
  EarthDayNightSurface,
  EarthDaySurface,
  PlaceholderEarthSurface,
} from './EarthSurface';
import { EndpointAnchor } from './EndpointAnchor';
import { GlobeGraticule } from './GlobeGraticule';
import { SatelliteMarker } from './SatelliteMarker';
import { ServiceSiteAnchor } from './ServiceSiteAnchor';
import { ServiceCorridorOverlay } from './ServiceCorridorOverlay';

interface HeroGlobeProps {
  earthTextures: EarthTextureSet | null;
  localInspectCue: GlobeLocalInspectCue | null;
  sunDirection: [number, number, number];
  worldGeometry: WorldGeometryTruth;
  serviceAvailability: ServiceAvailabilityTruth;
  serviceSelection: ServiceSelectionTruth;
}

export const GLOBE_RADIUS = 1.8;

export interface GlobeLocalInspectCue {
  endpointId: string;
  targetLabel: string;
  regionLabel: string;
  siteAnchorLabel: string;
  siteCenter: GeoCoordinate;
  siteAnchorOffset: {
    eastM: number;
    northM: number;
  };
  state: 'discoverable' | 'echo';
}

export function HeroGlobe({
  earthTextures,
  localInspectCue,
  sunDirection,
  worldGeometry,
  serviceAvailability,
  serviceSelection,
}: HeroGlobeProps) {
  const usesPlaceholderSurface =
    earthTextures?.availability !== 'approved-runtime' || earthTextures.dayTextureUrl === null;
  const usesDayNightShader =
    !usesPlaceholderSurface && earthTextures?.nightTextureUrl !== null;
  const usesCloudShell =
    !usesPlaceholderSurface && earthTextures?.cloudTextureUrl !== null;
  const activeRelayIds = new Set(
    serviceSelection.kind === 'supported' && serviceSelection.activePath
      ? serviceSelection.activePath.relaySatelliteIds
      : []
  );
  const localInspectEndpoint = localInspectCue
    ? worldGeometry.endpoints.find((endpoint) => endpoint.id === localInspectCue.endpointId) ?? null
    : null;

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
          textureSet={earthTextures}
          sunDirection={sunDirection}
        />
      ) : (
        <EarthDaySurface
          radius={GLOBE_RADIUS}
          textureSet={earthTextures}
        />
      )}

      {usesCloudShell && earthTextures?.cloudTextureUrl ? (
        <EarthCloudShell
          radius={GLOBE_RADIUS}
          textureSet={earthTextures}
          sunDirection={sunDirection}
        />
      ) : null}

      <EarthAtmosphereShell
        radius={GLOBE_RADIUS}
        textureSet={earthTextures}
        sunDirection={sunDirection}
      />

      <GlobeGraticule radius={GLOBE_RADIUS + 0.004} />

      {worldGeometry.endpoints.map((endpoint) => (
        <EndpointAnchor
          key={endpoint.id}
          endpoint={endpoint}
          globeRadius={GLOBE_RADIUS}
          localInspectCueState={localInspectCue?.endpointId === endpoint.id ? localInspectCue.state : null}
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

      {localInspectCue && localInspectEndpoint ? (
        <ServiceSiteAnchor
          cue={localInspectCue}
          endpoint={localInspectEndpoint}
          globeRadius={GLOBE_RADIUS}
        />
      ) : null}
    </group>
  );
}
