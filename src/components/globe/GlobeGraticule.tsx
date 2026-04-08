import { Line } from '@react-three/drei';
import { latLonToSpherePosition } from '../../lib/geo';

interface GlobeGraticuleProps {
  radius: number;
}

const LATITUDES = [-60, -30, 0, 30, 60];
const MERIDIANS = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];

function createLatitudeRing(latitudeDeg: number, radius: number) {
  const points: Array<[number, number, number]> = [];

  for (let step = 0; step <= 96; step += 1) {
    const longitudeDeg = -180 + (step / 96) * 360;
    points.push(latLonToSpherePosition(latitudeDeg, longitudeDeg, radius));
  }

  return points;
}

function createMeridianArc(longitudeDeg: number, radius: number) {
  const points: Array<[number, number, number]> = [];

  for (let step = 0; step <= 64; step += 1) {
    const latitudeDeg = -90 + (step / 64) * 180;
    points.push(latLonToSpherePosition(latitudeDeg, longitudeDeg, radius));
  }

  return points;
}

export function GlobeGraticule({ radius }: GlobeGraticuleProps) {
  return (
    <group>
      {LATITUDES.map((latitudeDeg) => (
        <Line
          key={`latitude-${latitudeDeg}`}
          points={createLatitudeRing(latitudeDeg, radius)}
          color="#9bb7cc"
          transparent
          opacity={latitudeDeg === 0 ? 0.14 : 0.06}
        />
      ))}

      {MERIDIANS.map((longitudeDeg) => (
        <Line
          key={`meridian-${longitudeDeg}`}
          points={createMeridianArc(longitudeDeg, radius)}
          color="#9bb7cc"
          transparent
          opacity={longitudeDeg === 0 ? 0.14 : 0.06}
        />
      ))}
    </group>
  );
}
