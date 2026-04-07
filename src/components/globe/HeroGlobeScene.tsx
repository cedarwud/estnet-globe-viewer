import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import type {
  ServiceAvailabilityTruth,
  ServiceSelectionTruth,
  WorldGeometryTruth,
} from '../../truth/contracts';
import { HeroGlobe } from './HeroGlobe';

interface HeroGlobeSceneProps {
  worldGeometry: WorldGeometryTruth;
  serviceAvailability: ServiceAvailabilityTruth;
  serviceSelection: ServiceSelectionTruth;
}

export function HeroGlobeScene({
  worldGeometry,
  serviceAvailability,
  serviceSelection,
}: HeroGlobeSceneProps) {
  return (
    <Canvas
      className="hero-globe-canvas"
      dpr={[1, 1.8]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
    >
      <color attach="background" args={['#050916']} />
      <fog attach="fog" args={['#050916', 7, 15]} />

      <PerspectiveCamera
        makeDefault
        position={[0.85, 1.45, 10.8]}
        fov={32}
        near={0.1}
        far={120}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        // Keep the whole globe readable at initial load while still allowing a closer
        // corridor inspection pass without letting the camera fly off into empty space.
        minDistance={3}
        maxDistance={20}
        zoomSpeed={0.85}
        rotateSpeed={0.72}
        minPolarAngle={0.45}
        maxPolarAngle={Math.PI - 0.45}
      />

      <ambientLight intensity={0.72} />
      <hemisphereLight
        color="#a8d4ff"
        groundColor="#08121d"
        intensity={0.7}
      />
      <directionalLight
        position={[6, 4, 6]}
        intensity={1.9}
        color="#fff1cf"
      />
      <directionalLight
        position={[-5, -3, -4]}
        intensity={0.28}
        color="#69d0ff"
      />

      <Stars
        radius={90}
        depth={45}
        count={3200}
        factor={3.4}
        saturation={0}
        fade
        speed={0.55}
      />

      <HeroGlobe
        worldGeometry={worldGeometry}
        serviceAvailability={serviceAvailability}
        serviceSelection={serviceSelection}
      />
    </Canvas>
  );
}
