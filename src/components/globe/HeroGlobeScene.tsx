import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import type { EndpointGeometryTruth } from '../../truth/contracts';
import { HeroGlobe } from './HeroGlobe';

interface HeroGlobeSceneProps {
  endpoints: EndpointGeometryTruth[];
}

export function HeroGlobeScene({ endpoints }: HeroGlobeSceneProps) {
  return (
    <Canvas
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
        position={[5.4, 2.8, 5.4]}
        fov={24}
        near={0.1}
        far={80}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={4.8}
        maxDistance={8.8}
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

      <HeroGlobe endpoints={endpoints} />
    </Canvas>
  );
}
