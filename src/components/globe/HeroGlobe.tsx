import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { BackSide, Color, SRGBColorSpace, Texture } from 'three';
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

function configureEarthDayTexture(texture: Texture, anisotropy: number) {
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

function PlaceholderEarthSurface() {
  return (
    <mesh name="earth-placeholder-surface">
      <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
      <meshStandardMaterial
        color="#0f223a"
        emissive={new Color('#1f466d')}
        emissiveIntensity={0.42}
        roughness={0.84}
        metalness={0.08}
      />
    </mesh>
  );
}

function TexturedEarthSurface({ textureUrl }: { textureUrl: string }) {
  const { gl } = useThree();
  const dayTexture = useTexture(textureUrl);
  const configuredDayTexture = useMemo(
    () => configureEarthDayTexture(dayTexture, Math.min(gl.capabilities.getMaxAnisotropy(), 8)),
    [dayTexture, gl]
  );

  return (
    <mesh name="earth-textured-surface">
      <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
      <meshStandardMaterial
        map={configuredDayTexture}
        color="#ffffff"
        emissive={new Color('#05070a')}
        emissiveIntensity={0.03}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

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
      {/* The imagery seam decides whether Step 1 may use the approved day baseline.
          Keep the placeholder path available as an explicit fallback instead of a hidden failure mode. */}
      {usesPlaceholderSurface || !earthTextures?.dayTextureUrl ? (
        <PlaceholderEarthSurface />
      ) : (
        <TexturedEarthSurface textureUrl={earthTextures.dayTextureUrl} />
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
