import { Vector3 } from 'three';
import { geoCoordinateToScenePosition, type Vec3 } from '../../lib/geo';
import type {
  ActivePathTruth,
  ServiceSelectionTruth,
  WorldGeometryTruth,
} from '../../truth/contracts';

export type FramingMode = 'home' | 'fit-corridor';

interface BuildHeroFramingPoseOptions {
  globeRadius: number;
  mode: FramingMode;
  serviceSelection: ServiceSelectionTruth;
  worldGeometry: WorldGeometryTruth;
}

interface FramingPose {
  cameraPosition: Vec3;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function fallbackPose(mode: FramingMode): FramingPose {
  const distance = mode === 'home' ? 10.6 : 6.6;
  const direction = new Vector3(0.18, 0.26, 0.95).normalize().multiplyScalar(distance);

  return {
    cameraPosition: direction.toArray() as Vec3,
  };
}

function findCorridorCoordinates(
  worldGeometry: WorldGeometryTruth,
  activePath: ActivePathTruth | null
) {
  if (!activePath) {
    return [];
  }

  const endpointById = new Map(worldGeometry.endpoints.map((endpoint) => [endpoint.id, endpoint]));
  const satelliteById = new Map(worldGeometry.satellites.map((satellite) => [satellite.id, satellite]));

  return [
    endpointById.get(activePath.endpointIds[0])?.position,
    ...activePath.relaySatelliteIds.map((relayId) => satelliteById.get(relayId)?.position),
    endpointById.get(activePath.endpointIds[1])?.position,
  ].filter((coordinate): coordinate is NonNullable<typeof coordinate> => Boolean(coordinate));
}

function averageDirection(positions: Vector3[]) {
  const direction = positions.reduce(
    (sum, position) => sum.add(position.clone().normalize()),
    new Vector3()
  );

  if (direction.lengthSq() < 1e-6) {
    return new Vector3(0, 0, 1);
  }

  // The active corridor sits in the northern hemisphere. Flatten the north bias
  // slightly so the first frame reads the pair and corridor before it feels top-down.
  direction.y *= 0.55;
  return direction.normalize();
}

export function buildHeroFramingPose({
  globeRadius,
  mode,
  serviceSelection,
  worldGeometry,
}: BuildHeroFramingPoseOptions): FramingPose {
  const activePath = serviceSelection.kind === 'supported' ? serviceSelection.activePath : null;
  const coordinates = findCorridorCoordinates(worldGeometry, activePath);

  if (coordinates.length < 2) {
    return fallbackPose(mode);
  }

  const positions = coordinates.map((coordinate) => geoCoordinateToScenePosition(coordinate, globeRadius));
  const directions = positions.map((position) => position.clone().normalize());
  const focusDirection = averageDirection(positions);
  const worldUp = new Vector3(0, 1, 0);

  let pathNormal = new Vector3().crossVectors(directions[0], directions[directions.length - 1]);
  if (pathNormal.lengthSq() < 1e-6) {
    pathNormal = new Vector3().crossVectors(worldUp, focusDirection);
  }
  if (pathNormal.lengthSq() < 1e-6) {
    pathNormal = new Vector3(0, 0, 1);
  }
  pathNormal.normalize();

  let shoulderDirection = new Vector3().crossVectors(pathNormal, focusDirection);
  if (shoulderDirection.lengthSq() < 1e-6) {
    shoulderDirection = new Vector3().crossVectors(worldUp, focusDirection);
  }
  if (shoulderDirection.lengthSq() < 1e-6) {
    shoulderDirection = new Vector3(1, 0, 0);
  }
  shoulderDirection.normalize();

  const spreadAngle = directions.reduce((maxAngle, direction) => {
    return Math.max(maxAngle, focusDirection.angleTo(direction));
  }, 0);
  const distance =
    mode === 'home'
      ? clamp(9.5 + spreadAngle * 1.15, 9.5, 10.2)
      : clamp(5.35 + spreadAngle * 1.85, 5.7, 6.7);
  const cameraDirection = focusDirection
    .clone()
    .multiplyScalar(1)
    .add(shoulderDirection.clone().multiplyScalar(mode === 'home' ? 0.1 : 0.18))
    .add(worldUp.clone().multiplyScalar(mode === 'home' ? 0.09 : 0.03))
    .normalize();

  return {
    cameraPosition: cameraDirection.multiplyScalar(distance).toArray() as Vec3,
  };
}
