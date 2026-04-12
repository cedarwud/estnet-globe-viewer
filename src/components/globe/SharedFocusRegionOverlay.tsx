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
 * This is the first real shared ceiling above the pure texture-only baseline.
 * The visual is intentionally restrained: a soft multi-ring halo around the
 * focus region center, distinct from the endpoint anchor and clearly
 * not a local-mode terrain view.
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
  const regionEmissive = new Color('#5ebbde').multiplyScalar(0.3);

  useFrame(({ clock }) => {
    const material = outerPulseRef.current?.material;
    if (material && !Array.isArray(material) && 'opacity' in material) {
      const breathe = 0.06 + Math.sin(clock.getElapsedTime() * 0.6) * 0.03;
      material.opacity = breathe;
    }
  });

  return (
    <group>
      {/* Inner boundary ring — steady, marks the core focus region */}
      <Billboard position={position} follow>
        <mesh>
          <ringGeometry args={[0.19, 0.21, 64]} />
          <meshBasicMaterial
            color={regionColor}
            transparent
            opacity={0.14}
            depthWrite={false}
          />
        </mesh>
      </Billboard>

      {/* Middle extent ring — slightly larger, softer */}
      <Billboard position={position} follow>
        <mesh>
          <ringGeometry args={[0.26, 0.275, 64]} />
          <meshBasicMaterial
            color={regionColor}
            transparent
            opacity={0.07}
            depthWrite={false}
          />
        </mesh>
      </Billboard>

      {/* Outer breathing ring — slow pulse to indicate live detail */}
      <Billboard position={position} follow>
        <mesh ref={outerPulseRef}>
          <ringGeometry args={[0.33, 0.345, 64]} />
          <meshBasicMaterial
            color={regionColor}
            transparent
            opacity={0.06}
            depthWrite={false}
          />
        </mesh>
      </Billboard>

      {/* Soft filled disc behind the rings — very faint region highlight */}
      <Billboard position={position} follow>
        <mesh>
          <circleGeometry args={[0.19, 64]} />
          <meshBasicMaterial
            color={regionColor}
            transparent
            opacity={0.025}
            depthWrite={false}
          />
        </mesh>
      </Billboard>

      {/* Small center marker — distinct from endpoint anchor */}
      <mesh position={position}>
        <sphereGeometry args={[0.018, 20, 20]} />
        <meshStandardMaterial
          color={regionColor}
          emissive={regionEmissive}
          emissiveIntensity={1}
          roughness={0.3}
          transparent
          opacity={0.6}
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
