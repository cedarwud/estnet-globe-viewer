import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Vector3 } from 'three';
import type {
  ServiceAvailabilityTruth,
  ServiceSelectionTruth,
  WorldGeometryTruth,
} from '../../truth/contracts';
import type { HomeGlobePayload } from '../../homeGlobe/homeGlobePayload';
import { buildHeroFramingPose, type FramingMode, type FramingPose } from './corridorFraming';
import { GLOBE_RADIUS, HeroGlobe, type GlobeLocalInspectCue } from './HeroGlobe';
import { HeroGlobeSkyDome } from './HeroGlobeSkyDome';

export interface HeroGlobeFramingRequest {
  mode: FramingMode;
  revision: number;
}

interface HeroGlobeSceneProps {
  homeGlobePayload: HomeGlobePayload;
  framingRequest: HeroGlobeFramingRequest;
  localInspectCue: GlobeLocalInspectCue | null;
  worldGeometry: WorldGeometryTruth;
  serviceAvailability: ServiceAvailabilityTruth;
  serviceSelection: ServiceSelectionTruth;
}

interface SceneContentsProps extends HeroGlobeSceneProps {
  initialPose: FramingPose;
}

const HERO_LIGHT_DISTANCE = 10.5;
const HERO_ROTATION_INERTIA_DECAY_PER_SECOND = 2.15;
const HERO_ROTATION_INERTIA_MIN_SPEED = 0.018;
const HERO_ROTATION_INERTIA_MAX_SPEED = 1.45;
function wrapAngularDelta(angle: number) {
  if (angle > Math.PI) {
    return angle - Math.PI * 2;
  }

  if (angle < -Math.PI) {
    return angle + Math.PI * 2;
  }

  return angle;
}

function SceneContents({
  homeGlobePayload,
  framingRequest,
  initialPose,
  localInspectCue,
  worldGeometry,
  serviceAvailability,
  serviceSelection,
}: SceneContentsProps) {
  const earthTextures = homeGlobePayload.earthBaseline;
  const sharedFocusDetail = homeGlobePayload.sharedFocusDetail;
  // When shared focus detail is resolved, allow modestly closer inspection.
  // The tighter bound is tied to real data, not arbitrary camera drift.
  const minDistance = sharedFocusDetail ? 2.45 : 2.7;
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const transitionTargetRef = useRef<Vector3 | null>(null);
  const rotationInertiaRef = useRef({
    dragging: false,
    azimuthVelocity: 0,
    polarVelocity: 0,
    lastAzimuth: 0,
    lastPolar: 0,
    lastTimestampMs: 0,
  });
  const { camera } = useThree();
  const sunDirection = useMemo(
    () => new Vector3(...initialPose.sunDirection).normalize(),
    [initialPose]
  );
  const initialLightPosition = useMemo(
    () => sunDirection.clone().multiplyScalar(HERO_LIGHT_DISTANCE).toArray() as [number, number, number],
    [sunDirection]
  );

  useEffect(() => {
    const pose = buildHeroFramingPose({
      globeRadius: GLOBE_RADIUS,
      localInspectCue,
      mode: framingRequest.mode,
      serviceSelection,
      worldGeometry,
    });

    transitionTargetRef.current = new Vector3(...pose.cameraPosition);
    rotationInertiaRef.current.dragging = false;
    rotationInertiaRef.current.azimuthVelocity = 0;
    rotationInertiaRef.current.polarVelocity = 0;
    rotationInertiaRef.current.lastAzimuth = 0;
    rotationInertiaRef.current.lastPolar = 0;
    rotationInertiaRef.current.lastTimestampMs = 0;
  }, [framingRequest.mode, framingRequest.revision, localInspectCue, serviceSelection, worldGeometry]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) {
      return undefined;
    }

    const inertiaState = rotationInertiaRef.current;

    const handleStart = () => {
      inertiaState.dragging = true;
      inertiaState.azimuthVelocity = 0;
      inertiaState.polarVelocity = 0;
      inertiaState.lastAzimuth = controls.getAzimuthalAngle();
      inertiaState.lastPolar = controls.getPolarAngle();
      inertiaState.lastTimestampMs = performance.now();
    };

    const handleEnd = () => {
      inertiaState.dragging = false;
    };

    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);

    return () => {
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('end', handleEnd);
    };
  }, []);

  useFrame((_, deltaSeconds) => {
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
      const inertiaState = rotationInertiaRef.current;

      if (inertiaState.dragging) {
        const nowMs = performance.now();
        const azimuth = controls.getAzimuthalAngle();
        const polar = controls.getPolarAngle();

        if (inertiaState.lastTimestampMs > 0) {
          const elapsedMs = nowMs - inertiaState.lastTimestampMs;

          if (elapsedMs > 8 && elapsedMs < 180) {
            const deltaSampleSeconds = elapsedMs / 1000;
            const azimuthDelta = wrapAngularDelta(azimuth - inertiaState.lastAzimuth);
            const polarDelta = polar - inertiaState.lastPolar;
            const measuredAzimuthVelocity = Math.max(
              -HERO_ROTATION_INERTIA_MAX_SPEED,
              Math.min(HERO_ROTATION_INERTIA_MAX_SPEED, azimuthDelta / deltaSampleSeconds)
            );
            const measuredPolarVelocity = Math.max(
              -HERO_ROTATION_INERTIA_MAX_SPEED,
              Math.min(HERO_ROTATION_INERTIA_MAX_SPEED, polarDelta / deltaSampleSeconds)
            );

            inertiaState.azimuthVelocity = inertiaState.azimuthVelocity * 0.34 + measuredAzimuthVelocity * 0.66;
            inertiaState.polarVelocity = inertiaState.polarVelocity * 0.34 + measuredPolarVelocity * 0.66;
          }
        }

        inertiaState.lastAzimuth = azimuth;
        inertiaState.lastPolar = polar;
        inertiaState.lastTimestampMs = nowMs;
      } else if (!transitionTarget) {
        const combinedSpeed = Math.max(
          Math.abs(inertiaState.azimuthVelocity),
          Math.abs(inertiaState.polarVelocity)
        );

        if (combinedSpeed > HERO_ROTATION_INERTIA_MIN_SPEED) {
          const dampingEnabled = controls.enableDamping;
          controls.enableDamping = false;
          controls.setAzimuthalAngle(
            controls.getAzimuthalAngle() + inertiaState.azimuthVelocity * deltaSeconds
          );
          controls.setPolarAngle(
            controls.getPolarAngle() + inertiaState.polarVelocity * deltaSeconds
          );
          controls.enableDamping = dampingEnabled;

          const decay = Math.exp(-HERO_ROTATION_INERTIA_DECAY_PER_SECOND * deltaSeconds);
          inertiaState.azimuthVelocity *= decay;
          inertiaState.polarVelocity *= decay;
        } else {
          inertiaState.azimuthVelocity = 0;
          inertiaState.polarVelocity = 0;
        }
      }

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
        position={initialPose.cameraPosition}
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
        minDistance={minDistance}
        maxDistance={18.5}
        zoomSpeed={0.85}
        rotateSpeed={0.62}
        minPolarAngle={0.5}
        maxPolarAngle={Math.PI - 0.5}
      />

      <ambientLight intensity={0.06} />
      <directionalLight
        position={initialLightPosition}
        intensity={1.9}
        color="#fff6e2"
      />

      {/* The home globe keeps a visual-only sky panorama behind the Earth.
          It is intentionally not an astronomy-correct simulator. */}
      <HeroGlobeSkyDome />

      <HeroGlobe
        earthTextures={earthTextures}
        sharedFocusDetail={sharedFocusDetail}
        localInspectCue={localInspectCue}
        sunDirection={sunDirection}
        worldGeometry={worldGeometry}
        serviceAvailability={serviceAvailability}
        serviceSelection={serviceSelection}
      />
    </>
  );
}

export function HeroGlobeScene({
  homeGlobePayload,
  framingRequest,
  localInspectCue,
  worldGeometry,
  serviceAvailability,
  serviceSelection,
}: HeroGlobeSceneProps) {
  const initialPose = useMemo(() => {
    return buildHeroFramingPose({
      globeRadius: GLOBE_RADIUS,
      localInspectCue,
      mode: 'home',
      serviceSelection,
      worldGeometry,
    });
  }, [localInspectCue, serviceSelection, worldGeometry]);

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
      <color attach="background" args={['#03101b']} />
      <fog attach="fog" args={['#0b1a2c', 5.8, 14.0]} />

      <SceneContents
        homeGlobePayload={homeGlobePayload}
        framingRequest={framingRequest}
        initialPose={initialPose}
        localInspectCue={localInspectCue}
        worldGeometry={worldGeometry}
        serviceAvailability={serviceAvailability}
        serviceSelection={serviceSelection}
      />
    </Canvas>
  );
}
