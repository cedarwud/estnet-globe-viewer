import { Billboard, Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, Mesh } from 'three';
import { Color, Matrix4, Quaternion, Vector3 } from 'three';
import {
  buildSceneTangentBasis,
  geoCoordinateToScenePosition,
  offsetGeoCoordinateByMeters,
} from '../../lib/geo';
import type { EndpointGeometryTruth } from '../../truth/contracts';
import type { GlobeLocalInspectCue } from './HeroGlobe';

interface ServiceSiteAnchorProps {
  cue: GlobeLocalInspectCue;
  endpoint: EndpointGeometryTruth;
  globeRadius: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildEllipseOffset(
  angleRad: number,
  halfWidth: number,
  halfHeight: number,
  scale = 1
) {
  return {
    east: Math.cos(angleRad) * halfWidth * scale,
    north: Math.sin(angleRad) * halfHeight * scale,
  };
}

function projectSurfaceOffsetToShell(
  surfaceDirection: Vector3,
  tangentBasis: ReturnType<typeof buildSceneTangentBasis>,
  globeRadius: number,
  eastOffset: number,
  northOffset: number,
  lift = 0.014
) {
  return surfaceDirection
    .clone()
    .add(tangentBasis.east.clone().multiplyScalar(eastOffset))
    .add(tangentBasis.north.clone().multiplyScalar(northOffset))
    .normalize()
    .multiplyScalar(globeRadius + lift);
}

function buildProjectedEllipseLoop(params: {
  surfaceDirection: Vector3;
  tangentBasis: ReturnType<typeof buildSceneTangentBasis>;
  globeRadius: number;
  halfWidth: number;
  halfHeight: number;
  lift: number;
  startAngle?: number;
  endAngle?: number;
  segments?: number;
}) {
  const {
    surfaceDirection,
    tangentBasis,
    globeRadius,
    halfWidth,
    halfHeight,
    lift,
    startAngle = 0,
    endAngle = Math.PI * 2,
    segments = 72,
  } = params;
  const points: Vector3[] = [];

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const angle = startAngle + (endAngle - startAngle) * t;
    const offset = buildEllipseOffset(angle, halfWidth, halfHeight);

    points.push(
      projectSurfaceOffsetToShell(
        surfaceDirection,
        tangentBasis,
        globeRadius,
        offset.east,
        offset.north,
        lift
      )
    );
  }

  return points;
}

export function ServiceSiteAnchor({
  cue,
  endpoint,
  globeRadius,
}: ServiceSiteAnchorProps) {
  const arrivalRegionRef = useRef<Group>(null);
  const arrivalGateRef = useRef<Group>(null);
  const beaconHaloRef = useRef<Group>(null);
  const beaconPulseRef = useRef<Mesh>(null);
  const calloutGroupRef = useRef<Group>(null);
  const phaseOffset = cue.state === 'echo' ? 0.35 : 0;
  const siteGeometry = useMemo(() => {
    const endpointPosition = geoCoordinateToScenePosition(endpoint.position, globeRadius);
    const serviceSiteCoordinate = offsetGeoCoordinateByMeters(
      cue.siteCenter,
      cue.siteAnchorOffset.eastM,
      cue.siteAnchorOffset.northM
    );
    const actualSitePosition = geoCoordinateToScenePosition(serviceSiteCoordinate, globeRadius);
    const tangentBasis = buildSceneTangentBasis(
      cue.siteCenter.latitudeDeg,
      cue.siteCenter.longitudeDeg
    );
    const presentationDirection = tangentBasis.east
      .clone()
      .multiplyScalar(cue.siteAnchorOffset.eastM)
      .add(tangentBasis.north.clone().multiplyScalar(cue.siteAnchorOffset.northM));

    if (presentationDirection.lengthSq() < 1e-6) {
      presentationDirection.copy(tangentBasis.east);
    }

    presentationDirection.normalize();

    const actualSeparation = endpointPosition.distanceTo(actualSitePosition);
    const visualSeparation = Math.min(0.56, Math.max(0.44, actualSeparation * 1040));
    const surfaceDirection = endpointPosition
      .clone()
      .add(presentationDirection.multiplyScalar(visualSeparation))
      .normalize();
    const regionHalfWidth = clamp(
      0.26 + (cue.arrivalRegion.halfWidthM / 3400) * 0.11,
      0.3,
      0.38
    );
    const regionHalfHeight = clamp(
      0.18 + (cue.arrivalRegion.halfHeightM / 3000) * 0.1,
      0.23,
      0.31
    );
    const hemisphereHalfWidth = regionHalfWidth * 2.32;
    const hemisphereHalfHeight = regionHalfHeight * 2.08;
    const midHemisphereHalfWidth = regionHalfWidth * 1.78;
    const midHemisphereHalfHeight = regionHalfHeight * 1.64;
    const approachDirectionLocal = new Vector3(
      -cue.siteAnchorOffset.eastM,
      -cue.siteAnchorOffset.northM,
      0
    );
    if (approachDirectionLocal.lengthSq() < 1e-6) {
      approachDirectionLocal.set(1, 0, 0);
    }
    approachDirectionLocal.normalize();
    const approachAngle = Math.atan2(approachDirectionLocal.y, approachDirectionLocal.x);
    const gateWidth = Math.PI * 0.42;
    const gateSpread = gateWidth * 0.76;
    const terminalScale = 1.94;
    const terminalCenterOffset = buildEllipseOffset(
      approachAngle,
      regionHalfWidth,
      regionHalfHeight,
      terminalScale
    );
    const terminalLeftOffset = buildEllipseOffset(
      approachAngle + gateSpread * 0.62,
      regionHalfWidth,
      regionHalfHeight,
      terminalScale
    );
    const terminalRightOffset = buildEllipseOffset(
      approachAngle - gateSpread * 0.62,
      regionHalfWidth,
      regionHalfHeight,
      terminalScale
    );
    const gateCenterOffset = buildEllipseOffset(
      approachAngle,
      regionHalfWidth,
      regionHalfHeight,
      1.02
    );
    const gateLeftOffset = buildEllipseOffset(
      approachAngle + gateSpread * 0.48,
      regionHalfWidth,
      regionHalfHeight,
      1.02
    );
    const gateRightOffset = buildEllipseOffset(
      approachAngle - gateSpread * 0.48,
      regionHalfWidth,
      regionHalfHeight,
      1.02
    );
    const innerCenterOffset = buildEllipseOffset(
      approachAngle,
      regionHalfWidth,
      regionHalfHeight,
      0.36
    );
    const innerLeftOffset = buildEllipseOffset(
      approachAngle + gateSpread * 0.28,
      regionHalfWidth,
      regionHalfHeight,
      0.5
    );
    const innerRightOffset = buildEllipseOffset(
      approachAngle - gateSpread * 0.28,
      regionHalfWidth,
      regionHalfHeight,
      0.5
    );
    const regionSurfacePosition = surfaceDirection.clone().multiplyScalar(globeRadius + 0.01);
    const terminalCenterPoint = projectSurfaceOffsetToShell(
      surfaceDirection,
      tangentBasis,
      globeRadius,
      terminalCenterOffset.east,
      terminalCenterOffset.north,
      0.05
    );
    const terminalLeftPoint = projectSurfaceOffsetToShell(
      surfaceDirection,
      tangentBasis,
      globeRadius,
      terminalLeftOffset.east,
      terminalLeftOffset.north,
      0.046
    );
    const terminalRightPoint = projectSurfaceOffsetToShell(
      surfaceDirection,
      tangentBasis,
      globeRadius,
      terminalRightOffset.east,
      terminalRightOffset.north,
      0.046
    );
    const gateCenterPoint = projectSurfaceOffsetToShell(
      surfaceDirection,
      tangentBasis,
      globeRadius,
      gateCenterOffset.east,
      gateCenterOffset.north,
      0.022
    );
    const gateLeftPoint = projectSurfaceOffsetToShell(
      surfaceDirection,
      tangentBasis,
      globeRadius,
      gateLeftOffset.east,
      gateLeftOffset.north,
      0.02
    );
    const gateRightPoint = projectSurfaceOffsetToShell(
      surfaceDirection,
      tangentBasis,
      globeRadius,
      gateRightOffset.east,
      gateRightOffset.north,
      0.02
    );
    const innerCenterPoint = projectSurfaceOffsetToShell(
      surfaceDirection,
      tangentBasis,
      globeRadius,
      innerCenterOffset.east,
      innerCenterOffset.north,
      0.03
    );
    const innerLeftPoint = projectSurfaceOffsetToShell(
      surfaceDirection,
      tangentBasis,
      globeRadius,
      innerLeftOffset.east,
      innerLeftOffset.north,
      0.026
    );
    const innerRightPoint = projectSurfaceOffsetToShell(
      surfaceDirection,
      tangentBasis,
      globeRadius,
      innerRightOffset.east,
      innerRightOffset.north,
      0.026
    );
    const coreSurfacePoint = surfaceDirection.clone().multiplyScalar(globeRadius + 0.028);
    const handoffStart = endpointPosition.clone().normalize().multiplyScalar(globeRadius + 0.02);
    const handoffEnd = terminalCenterPoint;
    const handoffMid = handoffStart
      .clone()
      .add(handoffEnd)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(globeRadius + 0.092);
    const beaconPosition = surfaceDirection.clone().multiplyScalar(globeRadius + 0.086);
    const stemStart = surfaceDirection.clone().multiplyScalar(globeRadius + 0.018);
    const surfaceQuaternion = new Quaternion().setFromRotationMatrix(
      new Matrix4().makeBasis(
        tangentBasis.east.clone(),
        tangentBasis.north.clone(),
        surfaceDirection.clone()
      )
    );

    return {
      surfaceDirection,
      regionSurfacePosition,
      beaconPosition,
      handoffPoints: [handoffStart, handoffMid, handoffEnd],
      stemPoints: [stemStart, beaconPosition],
      hemisphereLoops: [
        buildProjectedEllipseLoop({
          surfaceDirection,
          tangentBasis,
          globeRadius,
          halfWidth: hemisphereHalfWidth,
          halfHeight: hemisphereHalfHeight,
          lift: 0.026,
        }),
        buildProjectedEllipseLoop({
          surfaceDirection,
          tangentBasis,
          globeRadius,
          halfWidth: midHemisphereHalfWidth,
          halfHeight: midHemisphereHalfHeight,
          lift: 0.022,
        }),
        buildProjectedEllipseLoop({
          surfaceDirection,
          tangentBasis,
          globeRadius,
          halfWidth: regionHalfWidth * 1.34,
          halfHeight: regionHalfHeight * 1.3,
          lift: 0.018,
        }),
      ],
      hemisphereSweepLines: [
        [terminalLeftPoint, gateLeftPoint, innerLeftPoint],
        [terminalCenterPoint, gateCenterPoint, innerCenterPoint, coreSurfacePoint],
        [terminalRightPoint, gateRightPoint, innerRightPoint],
      ],
      terminalApproachArc: buildProjectedEllipseLoop({
        surfaceDirection,
        tangentBasis,
        globeRadius,
        halfWidth: regionHalfWidth * 1.94,
        halfHeight: regionHalfHeight * 1.78,
        lift: 0.052,
        startAngle: approachAngle - gateWidth * 0.86,
        endAngle: approachAngle + gateWidth * 0.86,
        segments: 28,
      }),
      landingFanLines: [
        [terminalCenterPoint, terminalLeftPoint, gateLeftPoint, innerLeftPoint, coreSurfacePoint],
        [terminalCenterPoint, gateCenterPoint, innerCenterPoint, coreSurfacePoint],
        [terminalCenterPoint, terminalRightPoint, gateRightPoint, innerRightPoint, coreSurfacePoint],
      ],
      surfaceQuaternion,
      hemisphereHalfWidth,
      hemisphereHalfHeight,
      midHemisphereHalfWidth,
      midHemisphereHalfHeight,
      regionHalfWidth,
      regionHalfHeight,
      approachAngle,
      gateWidth,
    };
  }, [
    cue.arrivalRegion.halfHeightM,
    cue.arrivalRegion.halfWidthM,
    cue.siteAnchorOffset.eastM,
    cue.siteAnchorOffset.northM,
    cue.siteCenter,
    endpoint.position,
    globeRadius,
  ]);

  useFrame(({ camera, clock }) => {
    const pulseCycle = (clock.getElapsedTime() * 0.65 + phaseOffset) % 1;
    const haloScale = 1 + Math.sin(clock.getElapsedTime() * 2.2 + phaseOffset) * 0.08;
    const regionScale = 1 + Math.sin(clock.getElapsedTime() * 1.6 + phaseOffset) * 0.032;
    const gateScale = 1 + Math.sin(clock.getElapsedTime() * 2.4 + phaseOffset) * 0.05;

    if (arrivalRegionRef.current) {
      arrivalRegionRef.current.scale.setScalar(regionScale);
    }

    if (arrivalGateRef.current) {
      arrivalGateRef.current.scale.setScalar(gateScale);
    }

    if (beaconHaloRef.current) {
      beaconHaloRef.current.scale.setScalar(haloScale);
    }

    const pulseMaterial = beaconPulseRef.current?.material;
    if (pulseMaterial && !Array.isArray(pulseMaterial) && 'opacity' in pulseMaterial) {
      pulseMaterial.opacity = (cue.state === 'echo' ? 0.2 : 0.14) * (1 - pulseCycle);
    }

    if (calloutGroupRef.current) {
      const facingDot = camera.position.clone().normalize().dot(siteGeometry.surfaceDirection);
      calloutGroupRef.current.visible = facingDot > -0.04;
    }
  });

  const handoffColor = cue.state === 'echo' ? '#ffd39b' : '#ffbf69';
  const beaconColor = cue.state === 'echo' ? '#ffe0ae' : '#ffbf69';
  const hemisphereColor = cue.state === 'echo' ? '#ffd39b' : '#62d7ff';
  const regionFillColor = cue.state === 'echo' ? '#ffd39b' : '#8be3ff';
  const landingWedgeColor = cue.state === 'echo' ? '#ffe0ae' : '#d4f6ff';
  const calloutTitle = cue.siteAnchorLabel;
  const calloutEyebrow = cue.state === 'echo' ? 'Pinned Arrival Hemisphere' : 'Arrival Hemisphere';
  const calloutMeta =
    cue.state === 'echo'
      ? 'Recently inspected landing region still anchored on return'
      : 'Current corridor descent into the bounded landing region';
  const calloutCopy =
    cue.state === 'echo'
      ? `Recent local return keeps this arrival hemisphere pinned on the home globe.`
      : `Corridor descent now commits to this bounded landing region.`;

  return (
    <>
      {siteGeometry.hemisphereLoops.map((loopPoints, loopIndex) => (
        <Line
          key={`arrival-hemisphere-loop-${loopIndex}`}
          points={loopPoints}
          color={hemisphereColor}
          transparent
          opacity={cue.state === 'echo' ? 0.22 + loopIndex * 0.08 : 0.18 + loopIndex * 0.08}
          lineWidth={loopIndex === 0 ? 1.1 : loopIndex === 1 ? 1.35 : 1.6}
        />
      ))}
      {siteGeometry.hemisphereSweepLines.map((linePoints, lineIndex) => (
        <Line
          key={`arrival-hemisphere-sweep-${lineIndex}`}
          points={linePoints}
          color={hemisphereColor}
          transparent
          opacity={cue.state === 'echo' ? 0.34 : 0.28}
          lineWidth={lineIndex === 1 ? 2.2 : 1.3}
        />
      ))}
      <Line
        points={siteGeometry.terminalApproachArc}
        color={landingWedgeColor}
        transparent
        opacity={cue.state === 'echo' ? 0.34 : 0.28}
        lineWidth={2.2}
      />
      <Line
        points={siteGeometry.handoffPoints}
        color={handoffColor}
        transparent
        opacity={cue.state === 'echo' ? 0.88 : 0.76}
        lineWidth={2.1}
      />
      <Line
        points={siteGeometry.handoffPoints}
        color={handoffColor}
        transparent
        opacity={cue.state === 'echo' ? 0.2 : 0.14}
        lineWidth={5.6}
      />
      <Line
        points={siteGeometry.stemPoints}
        color={handoffColor}
        transparent
        opacity={cue.state === 'echo' ? 0.74 : 0.56}
        lineWidth={1.2}
      />
      {siteGeometry.landingFanLines.map((linePoints, lineIndex) => (
        <Line
          key={`landing-fan-${lineIndex}`}
          points={linePoints}
          color={handoffColor}
          transparent
          opacity={cue.state === 'echo' ? 0.74 : 0.58}
          lineWidth={lineIndex === 1 ? 1.8 : 1.25}
        />
      ))}
      <Line
        points={siteGeometry.landingFanLines[1]}
        color={landingWedgeColor}
        transparent
        opacity={cue.state === 'echo' ? 0.26 : 0.2}
        lineWidth={4.8}
      />

      <group
        ref={arrivalRegionRef}
        position={siteGeometry.regionSurfacePosition.toArray()}
        quaternion={siteGeometry.surfaceQuaternion}
      >
        <mesh scale={[siteGeometry.regionHalfWidth * 1.46, siteGeometry.regionHalfHeight * 1.46, 1]}>
          <circleGeometry args={[1, 64]} />
          <meshBasicMaterial
            color={regionFillColor}
            transparent
            opacity={cue.state === 'echo' ? 0.14 : 0.1}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh scale={[siteGeometry.hemisphereHalfWidth * 1.06, siteGeometry.hemisphereHalfHeight * 1.02, 1]}>
          <circleGeometry args={[1, 72]} />
          <meshBasicMaterial
            color={hemisphereColor}
            transparent
            opacity={cue.state === 'echo' ? 0.09 : 0.07}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh scale={[siteGeometry.midHemisphereHalfWidth, siteGeometry.midHemisphereHalfHeight, 1]}>
          <circleGeometry args={[1, 72]} />
          <meshBasicMaterial
            color={hemisphereColor}
            transparent
            opacity={cue.state === 'echo' ? 0.14 : 0.1}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh scale={[siteGeometry.hemisphereHalfWidth, siteGeometry.hemisphereHalfHeight, 1]}>
          <ringGeometry args={[0.9, 1.02, 72]} />
          <meshBasicMaterial
            color={hemisphereColor}
            transparent
            opacity={cue.state === 'echo' ? 0.18 : 0.12}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh scale={[siteGeometry.midHemisphereHalfWidth, siteGeometry.midHemisphereHalfHeight, 1]}>
          <ringGeometry args={[0.86, 1.02, 72]} />
          <meshBasicMaterial
            color={landingWedgeColor}
            transparent
            opacity={cue.state === 'echo' ? 0.24 : 0.18}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh scale={[siteGeometry.regionHalfWidth, siteGeometry.regionHalfHeight, 1]}>
          <circleGeometry args={[1, 64]} />
          <meshBasicMaterial
            color={regionFillColor}
            transparent
            opacity={cue.state === 'echo' ? 0.28 : 0.22}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh scale={[siteGeometry.regionHalfWidth, siteGeometry.regionHalfHeight, 1]}>
          <ringGeometry args={[0.78, 1, 64]} />
          <meshBasicMaterial
            color={handoffColor}
            transparent
            opacity={cue.state === 'echo' ? 0.68 : 0.54}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh scale={[siteGeometry.regionHalfWidth * 0.66, siteGeometry.regionHalfHeight * 0.66, 1]}>
          <ringGeometry args={[0.82, 1, 64]} />
          <meshBasicMaterial
            color={beaconColor}
            transparent
            opacity={cue.state === 'echo' ? 0.4 : 0.3}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <group ref={arrivalGateRef}>
          <mesh scale={[siteGeometry.regionHalfWidth * 0.98, siteGeometry.regionHalfHeight * 0.98, 1]}>
            <ringGeometry
              args={[
                0.22,
                0.98,
                64,
                1,
                siteGeometry.approachAngle - siteGeometry.gateWidth / 1.9,
                siteGeometry.gateWidth * 1.06,
              ]}
            />
            <meshBasicMaterial
              color={landingWedgeColor}
              transparent
              opacity={cue.state === 'echo' ? 0.34 : 0.28}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh scale={[siteGeometry.regionHalfWidth, siteGeometry.regionHalfHeight, 1]}>
            <ringGeometry
              args={[
                0.86,
                1.1,
                64,
                1,
                siteGeometry.approachAngle - siteGeometry.gateWidth / 2,
                siteGeometry.gateWidth,
              ]}
            />
            <meshBasicMaterial
              color={beaconColor}
              transparent
              opacity={cue.state === 'echo' ? 0.82 : 0.74}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh scale={[siteGeometry.regionHalfWidth * 0.78, siteGeometry.regionHalfHeight * 0.78, 1]}>
            <ringGeometry
              args={[
                0.92,
                1.12,
                64,
                1,
                siteGeometry.approachAngle - siteGeometry.gateWidth / 2.6,
                siteGeometry.gateWidth / 1.3,
              ]}
            />
            <meshBasicMaterial
              color={beaconColor}
              transparent
              opacity={cue.state === 'echo' ? 0.58 : 0.46}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>

      <mesh
        position={siteGeometry.regionSurfacePosition.toArray()}
        quaternion={siteGeometry.surfaceQuaternion}
      >
        <ringGeometry args={[0.04, 0.064, 48]} />
        <meshBasicMaterial
          color={handoffColor}
          transparent
          opacity={cue.state === 'echo' ? 0.64 : 0.5}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh
        position={siteGeometry.regionSurfacePosition.toArray()}
        quaternion={siteGeometry.surfaceQuaternion}
      >
        <circleGeometry args={[0.018, 32]} />
        <meshBasicMaterial
          color={beaconColor}
          transparent
          opacity={cue.state === 'echo' ? 0.86 : 0.78}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <Billboard
        position={siteGeometry.beaconPosition.toArray()}
        follow
      >
        <group ref={beaconHaloRef}>
          <mesh>
            <ringGeometry args={[0.038, 0.065, 48]} />
            <meshBasicMaterial
              color={handoffColor}
              transparent
              opacity={cue.state === 'echo' ? 0.3 : 0.22}
              depthWrite={false}
            />
          </mesh>
          <mesh ref={beaconPulseRef}>
            <ringGeometry args={[0.07, 0.094, 48]} />
            <meshBasicMaterial
              color={handoffColor}
              transparent
              opacity={0.12}
              depthWrite={false}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.017, 20, 20]} />
            <meshStandardMaterial
              color={beaconColor}
              emissive={new Color(beaconColor).multiplyScalar(0.56)}
              emissiveIntensity={1}
              roughness={0.22}
            />
          </mesh>
        </group>
      </Billboard>

      <Billboard
        position={siteGeometry.beaconPosition.toArray()}
        follow
      >
        <group
          ref={calloutGroupRef}
          position={endpoint.id === 'endpoint-alpha' ? [-0.82, 0.52, 0] : [-0.18, 0.08, 0]}
        >
          <Html occlude={false}>
            <div className={`service-site-anchor service-site-anchor--${cue.state}`}>
              <p className="service-site-anchor__eyebrow">{calloutEyebrow}</p>
              <p className="service-site-anchor__title">{calloutTitle}</p>
              <p className="service-site-anchor__meta">{calloutMeta}</p>
              <div className="service-site-anchor__trail">
                <span>Current corridor</span>
                <span className="service-site-anchor__trail-arrow">-&gt;</span>
                <span>Arrival hemisphere</span>
                <span className="service-site-anchor__trail-arrow">-&gt;</span>
                <span>Service-site core</span>
              </div>
              <p className="service-site-anchor__copy">{calloutCopy}</p>
            </div>
          </Html>
        </group>
      </Billboard>
    </>
  );
}
