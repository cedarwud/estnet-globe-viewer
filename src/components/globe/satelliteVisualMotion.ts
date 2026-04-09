import { MathUtils, Vector3 } from 'three';
import { altitudeKmToSceneOffset, buildSceneTangentBasis, geoCoordinateToScenePosition } from '../../lib/geo';
import type { GeoCoordinate, SatelliteGeometryTruth } from '../../truth/contracts';

const EARTH_REFERENCE_RADIUS_KM = 6371;
const TWO_PI = Math.PI * 2;
const VISUAL_ORBIT_SHELL_ALTITUDE_KM = 760;
const MIN_ORBIT_SPEED_RAD_PER_SEC = 0.042;
const MAX_ORBIT_SPEED_RAD_PER_SEC = 0.062;

export interface SatelliteVisualOrbitDescriptor {
  globeRadius: number;
  orbitRadius: number;
  orbitBasisU: Vector3;
  orbitBasisV: Vector3;
  orbitNormal: Vector3;
  phaseOffsetRad: number;
  angularSpeedRadPerSec: number;
}

export interface SatelliteVisualOrbitSample {
  coordinate: GeoCoordinate;
  scenePosition: Vector3;
  radialDirection: Vector3;
  travelDirection: Vector3;
}

function hashFraction(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

function buildFallbackOrbitNormal(baseDirection: Vector3) {
  const fallbackAxis = Math.abs(baseDirection.y) > 0.92
    ? new Vector3(1, 0, 0)
    : new Vector3(0, 1, 0);

  return new Vector3().crossVectors(baseDirection, fallbackAxis).normalize();
}

function sceneDirectionToGeoCoordinate(
  direction: Vector3,
  sceneRadius: number,
  globeRadius: number
): GeoCoordinate {
  const normalizedDirection = direction.clone().normalize();
  const altitudeSceneOffset = Math.max(0, sceneRadius - globeRadius);

  return {
    latitudeDeg: MathUtils.radToDeg(Math.asin(Math.min(1, Math.max(-1, normalizedDirection.y)))),
    longitudeDeg: MathUtils.radToDeg(Math.atan2(normalizedDirection.x, normalizedDirection.z)),
    altitudeKm: (altitudeSceneOffset / globeRadius) * EARTH_REFERENCE_RADIUS_KM,
  };
}

export function buildSatelliteVisualOrbitDescriptor(
  satellite: SatelliteGeometryTruth,
  globeRadius: number
): SatelliteVisualOrbitDescriptor {
  const baseDirection = geoCoordinateToScenePosition(satellite.position, globeRadius).normalize();
  const { east, north } = buildSceneTangentBasis(
    satellite.position.latitudeDeg,
    satellite.position.longitudeDeg
  );
  const headingAngleRad = MathUtils.degToRad(-52 + hashFraction(`${satellite.id}:heading`) * 104);
  const tangentDirection = east
    .clone()
    .multiplyScalar(Math.cos(headingAngleRad))
    .add(north.clone().multiplyScalar(Math.sin(headingAngleRad)))
    .normalize();

  const orbitNormal = new Vector3().crossVectors(baseDirection, tangentDirection);
  if (orbitNormal.lengthSq() < 1e-6) {
    orbitNormal.copy(buildFallbackOrbitNormal(baseDirection));
  } else {
    orbitNormal.normalize();
  }

  const phaseOffsetRad = hashFraction(`${satellite.id}:phase`) * TWO_PI;
  const orbitBasisU = baseDirection.clone().applyAxisAngle(orbitNormal, -phaseOffsetRad).normalize();
  const orbitBasisV = new Vector3().crossVectors(orbitNormal, orbitBasisU).normalize();

  return {
    globeRadius,
    orbitRadius: globeRadius + altitudeKmToSceneOffset(VISUAL_ORBIT_SHELL_ALTITUDE_KM, globeRadius),
    orbitBasisU,
    orbitBasisV,
    orbitNormal,
    phaseOffsetRad,
    angularSpeedRadPerSec:
      MIN_ORBIT_SPEED_RAD_PER_SEC +
      hashFraction(`${satellite.id}:speed`) * (MAX_ORBIT_SPEED_RAD_PER_SEC - MIN_ORBIT_SPEED_RAD_PER_SEC),
  };
}

export function sampleSatelliteVisualOrbit(
  descriptor: SatelliteVisualOrbitDescriptor,
  elapsedTimeSec: number
): SatelliteVisualOrbitSample {
  const orbitAngle = descriptor.phaseOffsetRad + elapsedTimeSec * descriptor.angularSpeedRadPerSec;
  const radialDirection = descriptor.orbitBasisU
    .clone()
    .multiplyScalar(Math.cos(orbitAngle))
    .add(descriptor.orbitBasisV.clone().multiplyScalar(Math.sin(orbitAngle)))
    .normalize();
  const travelDirection = descriptor.orbitBasisU
    .clone()
    .multiplyScalar(-Math.sin(orbitAngle))
    .add(descriptor.orbitBasisV.clone().multiplyScalar(Math.cos(orbitAngle)))
    .normalize();
  const scenePosition = radialDirection.clone().multiplyScalar(descriptor.orbitRadius);

  return {
    coordinate: sceneDirectionToGeoCoordinate(
      radialDirection,
      descriptor.orbitRadius,
      descriptor.globeRadius
    ),
    scenePosition,
    radialDirection,
    travelDirection,
  };
}
