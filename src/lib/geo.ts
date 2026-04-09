import { Vector3 } from 'three';
import type { GeoCoordinate } from '../truth/contracts';

export type Vec3 = [number, number, number];
const EARTH_REFERENCE_RADIUS_KM = 6371;

function degreesToRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function latLonToSpherePosition(
  latitudeDeg: number,
  longitudeDeg: number,
  radius: number,
  altitude = 0
): Vec3 {
  const latitude = degreesToRadians(latitudeDeg);
  const longitude = degreesToRadians(longitudeDeg);
  const distanceFromCenter = radius + altitude;

  // Y points north, +Z faces the prime meridian, and east-positive longitude rotates toward +X.
  const x = distanceFromCenter * Math.cos(latitude) * Math.sin(longitude);
  const y = distanceFromCenter * Math.sin(latitude);
  const z = distanceFromCenter * Math.cos(latitude) * Math.cos(longitude);

  return [x, y, z];
}

function geoDirection(latitudeDeg: number, longitudeDeg: number) {
  const [x, y, z] = latLonToSpherePosition(latitudeDeg, longitudeDeg, 1);
  return new Vector3(x, y, z).normalize();
}

export function offsetGeoCoordinateByMeters(
  coordinate: GeoCoordinate,
  eastM: number,
  northM: number
): GeoCoordinate {
  const metersPerLatitudeDegree = 111_320;
  const latitudeRadians = degreesToRadians(coordinate.latitudeDeg);
  const metersPerLongitudeDegree = Math.max(1, metersPerLatitudeDegree * Math.cos(latitudeRadians));

  return {
    latitudeDeg: coordinate.latitudeDeg + northM / metersPerLatitudeDegree,
    longitudeDeg: coordinate.longitudeDeg + eastM / metersPerLongitudeDegree,
    altitudeKm: coordinate.altitudeKm,
  };
}

export function buildSceneTangentBasis(
  latitudeDeg: number,
  longitudeDeg: number
) {
  const latitude = degreesToRadians(latitudeDeg);
  const longitude = degreesToRadians(longitudeDeg);
  const up = geoDirection(latitudeDeg, longitudeDeg);
  const east = new Vector3(Math.cos(longitude), 0, -Math.sin(longitude)).normalize();
  const north = new Vector3(
    -Math.sin(latitude) * Math.sin(longitude),
    Math.cos(latitude),
    -Math.sin(latitude) * Math.cos(longitude)
  ).normalize();

  return {
    east,
    north,
    up,
  };
}

export function altitudeKmToSceneOffset(altitudeKm: number | null, globeRadius: number) {
  if (!altitudeKm) {
    return 0;
  }

  return globeRadius * (altitudeKm / EARTH_REFERENCE_RADIUS_KM);
}

function slerpDirection(start: Vector3, end: Vector3, t: number) {
  const dot = Math.min(1, Math.max(-1, start.dot(end)));

  if (dot > 0.9995 || dot < -0.9995) {
    return start.clone().lerp(end, t).normalize();
  }

  const theta = Math.acos(dot);
  const sinTheta = Math.sin(theta);
  const startWeight = Math.sin((1 - t) * theta) / sinTheta;
  const endWeight = Math.sin(t * theta) / sinTheta;

  return start
    .clone()
    .multiplyScalar(startWeight)
    .add(end.clone().multiplyScalar(endWeight))
    .normalize();
}

export function geoCoordinateToScenePosition(
  coordinate: GeoCoordinate,
  globeRadius: number
) {
  const direction = geoDirection(coordinate.latitudeDeg, coordinate.longitudeDeg);
  const radius = globeRadius + altitudeKmToSceneOffset(coordinate.altitudeKm, globeRadius);

  return direction.multiplyScalar(radius);
}

export function estimateCorridorLegPeakHeight(
  start: GeoCoordinate,
  end: GeoCoordinate,
  globeRadius: number,
  ceiling = 0.12
) {
  const startDirection = geoDirection(start.latitudeDeg, start.longitudeDeg);
  const endDirection = geoDirection(end.latitudeDeg, end.longitudeDeg);
  const angularSpan = Math.acos(Math.min(1, Math.max(-1, startDirection.dot(endDirection))));
  const maxNodeOffset = Math.max(
    altitudeKmToSceneOffset(start.altitudeKm, globeRadius),
    altitudeKmToSceneOffset(end.altitudeKm, globeRadius)
  );

  // Corridor legs should acknowledge altitude and span, but they should not
  // overshoot the relay geometry enough to suggest a fictitious higher path.
  return Math.min(
    ceiling,
    Math.max(0.03, maxNodeOffset * 0.35 + globeRadius * angularSpan * 0.015)
  );
}

export function buildElevatedArcPoints(
  start: GeoCoordinate,
  end: GeoCoordinate,
  globeRadius: number,
  options?: {
    peakHeight?: number;
    segments?: number;
  }
) {
  const startDirection = geoDirection(start.latitudeDeg, start.longitudeDeg);
  const endDirection = geoDirection(end.latitudeDeg, end.longitudeDeg);
  const startRadius = globeRadius + altitudeKmToSceneOffset(start.altitudeKm, globeRadius);
  const endRadius = globeRadius + altitudeKmToSceneOffset(end.altitudeKm, globeRadius);
  const peakHeight = options?.peakHeight ?? 0.28;
  const segments = options?.segments ?? 32;
  const points: Vector3[] = [];

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const direction = slerpDirection(startDirection, endDirection, t);
    const interpolatedRadius = startRadius + (endRadius - startRadius) * t;
    const liftedRadius = interpolatedRadius + Math.sin(Math.PI * t) * peakHeight;

    points.push(direction.multiplyScalar(liftedRadius));
  }

  return points;
}
