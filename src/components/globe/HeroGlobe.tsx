import { Suspense } from 'react';
import type {
  GeoCoordinate,
  ServiceAvailabilityTruth,
  ServiceSelectionTruth,
  WorldGeometryTruth,
} from '../../truth/contracts';
import type { Vector3 } from 'three';
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
import { SatelliteMarker, SatelliteMarkerFallback } from './SatelliteMarker';
import { ServiceCorridorOverlay } from './ServiceCorridorOverlay';

interface HeroGlobeProps {
  earthTextures: EarthTextureSet | null;
  localInspectCue: GlobeLocalInspectCue | null;
  sunDirection: Vector3;
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
  arrivalRegion: {
    halfWidthM: number;
    halfHeightM: number;
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
  const usesPlaceholderSurface = !earthTextures?.dayTextureUrl;
  const usesDayNightShader = !usesPlaceholderSurface && earthTextures?.nightTextureUrl !== null;
  const usesCloudShell = !usesPlaceholderSurface && earthTextures?.cloudTextureUrl !== null;
  const earthVisualKey = earthTextures
    ? [
        earthTextures.appearanceProfileId,
        earthTextures.dayAssetId ?? 'no-day',
        earthTextures.nightAssetId ?? 'no-night',
        earthTextures.cloudAssetId ?? 'no-cloud',
      ].join('::')
    : 'placeholder-earth';
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
        <PlaceholderEarthSurface
          key={earthVisualKey}
          radius={GLOBE_RADIUS}
        />
      ) : usesDayNightShader && earthTextures.nightTextureUrl ? (
        <EarthDayNightSurface
          key={`${earthVisualKey}::surface`}
          radius={GLOBE_RADIUS}
          textureSet={earthTextures}
          sunDirection={sunDirection}
        />
      ) : (
        <EarthDaySurface
          key={`${earthVisualKey}::surface`}
          radius={GLOBE_RADIUS}
          textureSet={earthTextures}
        />
      )}

      {usesCloudShell && earthTextures?.cloudTextureUrl ? (
        <EarthCloudShell
          key={`${earthVisualKey}::clouds`}
          radius={GLOBE_RADIUS}
          textureSet={earthTextures}
          sunDirection={sunDirection}
        />
      ) : null}

      <EarthAtmosphereShell
        key={`${earthVisualKey}::atmosphere`}
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

      {/* This layer stays visual-only: use the current service-relevant satellite identities,
          but render them as illustrative orbiting relays instead of static geometric markers. */}
      {worldGeometry.satellites.map((satellite) => (
        <Suspense
          key={satellite.id}
          fallback={(
            <SatelliteMarkerFallback
              satellite={satellite}
              globeRadius={GLOBE_RADIUS}
              state={activeRelayIds.has(satellite.id) ? 'active' : 'candidate'}
            />
          )}
        >
          <SatelliteMarker
            satellite={satellite}
            globeRadius={GLOBE_RADIUS}
            state={activeRelayIds.has(satellite.id) ? 'active' : 'candidate'}
          />
        </Suspense>
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
