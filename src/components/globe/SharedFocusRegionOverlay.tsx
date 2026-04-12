import { Billboard, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { Color } from 'three';
import { latLonToSpherePosition } from '../../lib/geo';
import type { HomeGlobeSharedFocusDetail } from '../../homeGlobe/homeGlobePayload';

interface SharedFocusRegionOverlayProps {
  focusDetail: HomeGlobeSharedFocusDetail;
  globeRadius: number;
}

/**
 * Renders a bounded focus-detail region indicator on the home globe surface.
 *
 * Round V1 visible uplift: opacities raised from near-invisible (0.025–0.14)
 * to clearly readable from home distance. The indicator must be obvious on
 * first screen without requiring the truth drawer to explain it.
 *
 * The same indicator renders in both offline and API modes — it signals
 * that closer home-globe inspection in this region is grounded in real
 * shared data (the offline AOI pack), not arbitrary camera drift.
 */
export function SharedFocusRegionOverlay({
  focusDetail,
  globeRadius,
}: SharedFocusRegionOverlayProps) {
  const outerPulseRef = useRef<Mesh>(null);
  const position = latLonToSpherePosition(
    focusDetail.center.latDeg,
    focusDetail.center.lonDeg,
    globeRadius,
    0.008
  );
  const regionColor = new Color('#5ebbde');
  const regionEmissive = new Color('#5ebbde').multiplyScalar(0.5);

  useFrame(({ clock }) => {
    const material = outerPulseRef.current?.material;
    if (material && !Array.isArray(material) && 'opacity' in material) {
      const breathe = 0.18 + Math.sin(clock.getElapsedTime() * 0.7) * 0.07;
      material.opacity = breathe;
    }
  });

  return (
    <group>
      {/* Inner boundary ring — steady, marks the core focus region */}
      <Billboard position={position} follow>
        <mesh>
          <ringGeometry args={[0.19, 0.215, 64]} />
          <meshBasicMaterial
            color={regionColor}
            transparent
            opacity={0.34}
            depthWrite={false}
          />
        </mesh>
      </Billboard>

      {/* Middle extent ring — slightly larger, visible secondary */}
      <Billboard position={position} follow>
        <mesh>
          <ringGeometry args={[0.26, 0.28, 64]} />
          <meshBasicMaterial
            color={regionColor}
            transparent
            opacity={0.18}
            depthWrite={false}
          />
        </mesh>
      </Billboard>

      {/* Outer breathing ring — pulse to indicate live detail */}
      <Billboard position={position} follow>
        <mesh ref={outerPulseRef}>
          <ringGeometry args={[0.33, 0.35, 64]} />
          <meshBasicMaterial
            color={regionColor}
            transparent
            opacity={0.18}
            depthWrite={false}
          />
        </mesh>
      </Billboard>

      {/* Filled disc behind the rings — visible region highlight */}
      <Billboard position={position} follow>
        <mesh>
          <circleGeometry args={[0.19, 64]} />
          <meshBasicMaterial
            color={regionColor}
            transparent
            opacity={0.08}
            depthWrite={false}
          />
        </mesh>
      </Billboard>

      {/* Center marker — larger, clearly distinct from endpoint anchor */}
      <mesh position={position}>
        <sphereGeometry args={[0.024, 24, 24]} />
        <meshStandardMaterial
          color={regionColor}
          emissive={regionEmissive}
          emissiveIntensity={1.2}
          roughness={0.25}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Region label — offset below the endpoint label to avoid overlap */}
      <group position={position}>
        <Html center occlude={false} style={{ pointerEvents: 'none' }}>
          <div className="focus-region-label">
            {focusDetail.regionLabel}
          </div>
        </Html>
      </group>
    </group>
  );
}
