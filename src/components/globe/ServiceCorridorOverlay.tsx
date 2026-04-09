import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { Line } from '@react-three/drei';
import {
  buildElevatedArcPoints,
  estimateCorridorLegPeakHeight,
  geoCoordinateToScenePosition,
} from '../../lib/geo';
import type {
  ActivePathTruth,
  ServiceAvailabilityTruth,
  ServiceSelectionTruth,
  WorldGeometryTruth,
} from '../../truth/contracts';
import type { GeoCoordinate } from '../../truth/contracts';
import {
  buildSatelliteVisualOrbitDescriptor,
  sampleSatelliteVisualOrbit,
} from './satelliteVisualMotion';

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
  satellitePositionsById: Map<string, GeoCoordinate>,
  globeRadius: number,
  style: {
    color: string;
    opacity: number;
    lineWidth: number;
    peakCeiling: number;
    glowColor?: string;
    glowOpacity?: number;
    glowLineWidth?: number;
  },
  keyPrefix: string
) {
  const endpointById = new Map(worldGeometry.endpoints.map((endpoint) => [endpoint.id, endpoint]));
  const legs: ReactElement[] = [];
  const orderedNodes = [
    endpointById.get(endpointIds[0])?.position,
    ...relaySatelliteIds.map((relayId) => satellitePositionsById.get(relayId)),
    endpointById.get(endpointIds[1])?.position,
  ];

  for (let index = 0; index < orderedNodes.length - 1; index += 1) {
    const start = orderedNodes[index];
    const end = orderedNodes[index + 1];

    if (!start || !end) {
      continue;
    }

    legs.push(
      <group key={`${keyPrefix}-${index}-group`}>
        {style.glowLineWidth && style.glowOpacity
          ? (
            <Line
              key={`${keyPrefix}-${index}-glow`}
              points={buildElevatedArcPoints(start, end, globeRadius, {
                segments: 42,
                peakHeight: estimateCorridorLegPeakHeight(start, end, globeRadius, style.peakCeiling),
              })}
              color={style.glowColor ?? style.color}
              transparent
              opacity={style.glowOpacity}
              lineWidth={style.glowLineWidth}
            />
            )
          : null}
        <Line
          key={`${keyPrefix}-${index}`}
          points={buildElevatedArcPoints(start, end, globeRadius, {
            segments: 42,
            peakHeight: estimateCorridorLegPeakHeight(start, end, globeRadius, style.peakCeiling),
          })}
          color={style.color}
          transparent
          opacity={style.opacity}
          lineWidth={style.lineWidth}
        />
      </group>
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
  const [motionTimeSec, setMotionTimeSec] = useState(0);
  const lastMotionUpdateRef = useRef(0);
  const activePath = serviceSelection.kind === 'supported' ? serviceSelection.activePath : null;
  const unavailableCandidate = resolveUnavailableCandidate(serviceAvailability, activePath);
  const orbitDescriptorsById = useMemo(
    () =>
      new Map(
        worldGeometry.satellites.map((satellite) => [
          satellite.id,
          buildSatelliteVisualOrbitDescriptor(satellite, globeRadius),
        ])
      ),
    [globeRadius, worldGeometry.satellites]
  );
  const visualOrbitSamplesById = useMemo(
    () =>
      new Map(
        worldGeometry.satellites.map((satellite) => {
          const descriptor = orbitDescriptorsById.get(satellite.id);

          return [
            satellite.id,
            descriptor ? sampleSatelliteVisualOrbit(descriptor, motionTimeSec) : null,
          ] as const;
        })
      ),
    [motionTimeSec, orbitDescriptorsById, worldGeometry.satellites]
  );
  const visualOrbitCoordinatesById = useMemo(
    () =>
      new Map(
        worldGeometry.satellites.map((satellite) => [
          satellite.id,
          visualOrbitSamplesById.get(satellite.id)?.coordinate ?? satellite.position,
        ])
      ),
    [visualOrbitSamplesById, worldGeometry.satellites]
  );

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    if (elapsedTime - lastMotionUpdateRef.current < 1 / 30) {
      return;
    }

    lastMotionUpdateRef.current = elapsedTime;
    setMotionTimeSec(elapsedTime);
  });

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
            visualOrbitCoordinatesById,
            globeRadius,
            {
              color: '#d0bfab',
              opacity: 0.36,
              lineWidth: 1.7,
              peakCeiling: 0.1,
            },
            'candidate'
          )
        : null}

      {activePath
        ? renderCorridorLegs(
            activePath.endpointIds,
            activePath.relaySatelliteIds,
            worldGeometry,
            visualOrbitCoordinatesById,
            globeRadius,
            {
              color: '#8ed2ff',
              opacity: 0.94,
              lineWidth: 2.4,
              peakCeiling: 0.12,
              glowColor: '#8ed2ff',
              glowOpacity: 0.18,
              glowLineWidth: 5.6,
            },
            'active'
          )
        : null}

      {activePath
        ? activePath.relaySatelliteIds.map((relayId) => {
            const orbitSample = visualOrbitSamplesById.get(relayId);
            if (!orbitSample) {
              return null;
            }

            return (
              <mesh
                key={`relay-highlight-${relayId}`}
                position={orbitSample.scenePosition.toArray()}
              >
                <sphereGeometry args={[0.11, 20, 20]} />
                <meshBasicMaterial
                  color="#8ed2ff"
                  transparent
                  opacity={0.14}
                  depthWrite={false}
                />
              </mesh>
            );
          })
        : null}
    </group>
  );
}
