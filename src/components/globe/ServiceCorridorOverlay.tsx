import type { ReactElement } from 'react';
import { Line } from '@react-three/drei';
import {
  buildElevatedArcPoints,
  geoCoordinateToScenePosition,
} from '../../lib/geo';
import type {
  ActivePathTruth,
  ServiceAvailabilityTruth,
  ServiceSelectionTruth,
  WorldGeometryTruth,
} from '../../truth/contracts';

interface ServiceCorridorOverlayProps {
  worldGeometry: WorldGeometryTruth;
  serviceAvailability: ServiceAvailabilityTruth;
  serviceSelection: ServiceSelectionTruth;
  globeRadius: number;
}

function pathKey(endpointIds: [string, string], relaySatelliteIds: string[]) {
  return `${endpointIds.join('::')}::${relaySatelliteIds.join('::')}`;
}

function renderCorridorLegs(
  endpointIds: [string, string],
  relaySatelliteIds: string[],
  worldGeometry: WorldGeometryTruth,
  globeRadius: number,
  style: {
    color: string;
    opacity: number;
    lineWidth: number;
    peakHeight: number;
  },
  keyPrefix: string
) {
  const endpointById = new Map(worldGeometry.endpoints.map((endpoint) => [endpoint.id, endpoint]));
  const satelliteById = new Map(worldGeometry.satellites.map((satellite) => [satellite.id, satellite]));
  const legs: ReactElement[] = [];
  const orderedNodes = [
    endpointById.get(endpointIds[0])?.position,
    ...relaySatelliteIds.map((relayId) => satelliteById.get(relayId)?.position),
    endpointById.get(endpointIds[1])?.position,
  ];

  for (let index = 0; index < orderedNodes.length - 1; index += 1) {
    const start = orderedNodes[index];
    const end = orderedNodes[index + 1];

    if (!start || !end) {
      continue;
    }

    legs.push(
      <Line
        key={`${keyPrefix}-${index}`}
        points={buildElevatedArcPoints(start, end, globeRadius, {
          segments: 42,
          peakHeight: style.peakHeight,
        })}
        color={style.color}
        transparent
        opacity={style.opacity}
        lineWidth={style.lineWidth}
      />
    );
  }

  return legs;
}

function resolveUnavailableCandidate(
  serviceAvailability: ServiceAvailabilityTruth,
  activePath: ActivePathTruth | null
) {
  if (serviceAvailability.kind !== 'supported') {
    return null;
  }

  // Keep the baseline intentionally sparse: one current corridor and at most one
  // unavailable candidate corridor are enough to communicate the service story.
  const activeKey = activePath ? pathKey(activePath.endpointIds, activePath.relaySatelliteIds) : null;

  return (
    serviceAvailability.candidatePaths.find((candidate) => {
      if (candidate.state !== 'unavailable') {
        return false;
      }

      return pathKey(candidate.endpointIds, candidate.relaySatelliteIds) !== activeKey;
    }) ?? null
  );
}

export function ServiceCorridorOverlay({
  worldGeometry,
  serviceAvailability,
  serviceSelection,
  globeRadius,
}: ServiceCorridorOverlayProps) {
  const activePath = serviceSelection.kind === 'supported' ? serviceSelection.activePath : null;
  const unavailableCandidate = resolveUnavailableCandidate(serviceAvailability, activePath);

  if (!activePath && !unavailableCandidate) {
    return null;
  }

  return (
    <group>
      {unavailableCandidate
        ? renderCorridorLegs(
            unavailableCandidate.endpointIds,
            unavailableCandidate.relaySatelliteIds,
            worldGeometry,
            globeRadius,
            {
              color: '#8d97a6',
              opacity: 0.32,
              lineWidth: 1.4,
              peakHeight: 0.24,
            },
            'candidate'
          )
        : null}

      {activePath
        ? renderCorridorLegs(
            activePath.endpointIds,
            activePath.relaySatelliteIds,
            worldGeometry,
            globeRadius,
            {
              color: '#8ed2ff',
              opacity: 0.94,
              lineWidth: 2.8,
              peakHeight: 0.34,
            },
            'active'
          )
        : null}

      {activePath
        ? activePath.relaySatelliteIds.map((relayId) => {
            const satellite = worldGeometry.satellites.find((entry) => entry.id === relayId);
            if (!satellite) {
              return null;
            }

            const highlightPosition = geoCoordinateToScenePosition(satellite.position, globeRadius);

            return (
              <mesh
                key={`relay-highlight-${relayId}`}
                position={highlightPosition.toArray()}
              >
                <sphereGeometry args={[0.09, 20, 20]} />
                <meshBasicMaterial
                  color="#8ed2ff"
                  transparent
                  opacity={0.1}
                  depthWrite={false}
                />
              </mesh>
            );
          })
        : null}
    </group>
  );
}
