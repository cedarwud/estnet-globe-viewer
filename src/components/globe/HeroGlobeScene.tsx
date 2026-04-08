import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Vector3 } from 'three';
import type {
  ServiceAvailabilityTruth,
  ServiceSelectionTruth,
  WorldGeometryTruth,
} from '../../truth/contracts';
import type { EarthTextureSet } from '../../imagery/provider';
import { buildHeroFramingPose, type FramingMode } from './corridorFraming';
import { GLOBE_RADIUS, HeroGlobe } from './HeroGlobe';

const heroSunDirection: [number, number, number] = [7.5, 4.5, 6.5];

export interface HeroGlobeFramingRequest {
  mode: FramingMode;
  revision: number;
}

interface HeroGlobeSceneProps {
  earthTextures: EarthTextureSet | null;
  framingRequest: HeroGlobeFramingRequest;
  worldGeometry: WorldGeometryTruth;
  serviceAvailability: ServiceAvailabilityTruth;
  serviceSelection: ServiceSelectionTruth;
}

interface SceneContentsProps extends HeroGlobeSceneProps {
  initialCameraPosition: [number, number, number];
}

function SceneContents({
  earthTextures,
  framingRequest,
  initialCameraPosition,
  worldGeometry,
  serviceAvailability,
  serviceSelection,
}: SceneContentsProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const transitionTargetRef = useRef<Vector3 | null>(null);
  const { camera } = useThree();

  useEffect(() => {
    const pose = buildHeroFramingPose({
      globeRadius: GLOBE_RADIUS,
      mode: framingRequest.mode,
      serviceSelection,
      worldGeometry,
    });

    transitionTargetRef.current = new Vector3(...pose.cameraPosition);
  }, [framingRequest.mode, framingRequest.revision, serviceSelection, worldGeometry]);

  useFrame(() => {
    const transitionTarget = transitionTargetRef.current;
    if (transitionTarget) {
      camera.position.lerp(transitionTarget, 0.12);

      if (camera.position.distanceTo(transitionTarget) < 0.02) {
        camera.position.copy(transitionTarget);
        transitionTargetRef.current = null;
      }
    }

    const controls = controlsRef.current;
    if (controls) {
      // Step 3 keeps every framing action globe-centered. Home and Fit Corridor
      // may move the camera, but they never leave a drifting pan target behind.
      controls.target.set(0, 0, 0);
      controls.update();
    }
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={initialCameraPosition}
        fov={28}
        near={0.1}
        far={120}
      />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        target={[0, 0, 0]}
        // Step 3 adds explicit Home / Fit Corridor presets instead of generic pan.
        // Keep the interaction globe-centered and bounded to corridor inspection.
        minDistance={2.8}
        maxDistance={18.5}
        zoomSpeed={0.85}
        rotateSpeed={0.62}
        minPolarAngle={0.5}
        maxPolarAngle={Math.PI - 0.5}
      />

      <ambientLight intensity={0.07} />
      <directionalLight
        position={heroSunDirection}
        intensity={1.85}
        color="#fff3d4"
      />

      <Stars
        radius={90}
        depth={45}
        count={2800}
        factor={3.1}
        saturation={0}
        fade
        speed={0.45}
      />

      <HeroGlobe
        earthTextures={earthTextures}
        sunDirection={heroSunDirection}
        worldGeometry={worldGeometry}
        serviceAvailability={serviceAvailability}
        serviceSelection={serviceSelection}
      />
    </>
  );
}

export function HeroGlobeScene({
  earthTextures,
  framingRequest,
  worldGeometry,
  serviceAvailability,
  serviceSelection,
}: HeroGlobeSceneProps) {
  const initialCameraPosition = useMemo(() => {
    return buildHeroFramingPose({
      globeRadius: GLOBE_RADIUS,
      mode: 'home',
      serviceSelection,
      worldGeometry,
    }).cameraPosition;
  }, [serviceSelection, worldGeometry]);

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
      <color attach="background" args={['#040816']} />
      <fog attach="fog" args={['#040816', 5.8, 13.4]} />

      <SceneContents
        earthTextures={earthTextures}
        framingRequest={framingRequest}
        initialCameraPosition={initialCameraPosition}
        worldGeometry={worldGeometry}
        serviceAvailability={serviceAvailability}
        serviceSelection={serviceSelection}
      />
    </Canvas>
  );
}
