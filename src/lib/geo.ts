export type Vec3 = [number, number, number];

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
