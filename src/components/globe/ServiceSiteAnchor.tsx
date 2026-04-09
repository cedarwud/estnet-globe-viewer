import { Billboard, Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, Mesh } from 'three';
import { Color, Quaternion, Vector3 } from 'three';
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

export function ServiceSiteAnchor({
  cue,
  endpoint,
  globeRadius,
}: ServiceSiteAnchorProps) {
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
    const visualSeparation = Math.min(0.22, Math.max(0.17, actualSeparation * 420));
    const surfaceDirection = endpointPosition
      .clone()
      .add(presentationDirection.multiplyScalar(visualSeparation))
      .normalize();
    const surfacePosition = surfaceDirection.clone().multiplyScalar(globeRadius + 0.008);
    const handoffStart = endpointPosition.clone().normalize().multiplyScalar(globeRadius + 0.02);
    const handoffEnd = surfaceDirection.clone().multiplyScalar(globeRadius + 0.018);
    const handoffMid = handoffStart
      .clone()
      .add(handoffEnd)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(globeRadius + 0.078);
    const beaconPosition = surfaceDirection.clone().multiplyScalar(globeRadius + 0.086);
    const stemStart = surfaceDirection.clone().multiplyScalar(globeRadius + 0.018);
    const footprintQuaternion = new Quaternion().setFromUnitVectors(
      new Vector3(0, 0, 1),
      surfaceDirection
    );

    return {
      surfaceDirection,
      surfacePosition,
      beaconPosition,
      handoffPoints: [handoffStart, handoffMid, handoffEnd],
      stemPoints: [stemStart, beaconPosition],
      footprintQuaternion,
    };
  }, [cue.siteAnchorOffset.eastM, cue.siteAnchorOffset.northM, cue.siteCenter, endpoint.position, globeRadius]);

  useFrame(({ camera, clock }) => {
    const pulseCycle = (clock.getElapsedTime() * 0.65 + phaseOffset) % 1;
    const haloScale = 1 + Math.sin(clock.getElapsedTime() * 2.2 + phaseOffset) * 0.08;

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
  const calloutTitle = cue.siteAnchorLabel;
  const calloutEyebrow = cue.state === 'echo' ? 'Pinned Ground Destination' : 'Corridor Landing Site';
  const calloutMeta = cue.state === 'echo' ? 'Recently inspected service-site anchor' : 'Distinct service-site anchor';
  const trailEnd = cue.state === 'echo' ? 'Pinned site anchor' : 'Ground site anchor';
  const calloutCopy =
    cue.state === 'echo'
      ? `The last local return keeps ${calloutTitle} pinned back into ${cue.regionLabel}.`
      : `${calloutTitle} now holds its own restrained ground anchor instead of borrowing the endpoint marker.`;

  return (
    <>
      <Line
        points={siteGeometry.handoffPoints}
        color={handoffColor}
        transparent
        opacity={cue.state === 'echo' ? 0.84 : 0.7}
        lineWidth={1.85}
      />
      <Line
        points={siteGeometry.handoffPoints}
        color={handoffColor}
        transparent
        opacity={cue.state === 'echo' ? 0.18 : 0.12}
        lineWidth={4.8}
      />
      <Line
        points={siteGeometry.stemPoints}
        color={handoffColor}
        transparent
        opacity={cue.state === 'echo' ? 0.74 : 0.56}
        lineWidth={1.2}
      />

      <mesh
        position={siteGeometry.surfacePosition.toArray()}
        quaternion={siteGeometry.footprintQuaternion}
      >
        <ringGeometry args={[0.04, 0.064, 48]} />
        <meshBasicMaterial
          color={handoffColor}
          transparent
          opacity={cue.state === 'echo' ? 0.56 : 0.42}
          depthWrite={false}
        />
      </mesh>
      <mesh
        position={siteGeometry.surfacePosition.toArray()}
        quaternion={siteGeometry.footprintQuaternion}
      >
        <circleGeometry args={[0.018, 32]} />
        <meshBasicMaterial
          color={beaconColor}
          transparent
          opacity={cue.state === 'echo' ? 0.82 : 0.74}
          depthWrite={false}
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
          position={endpoint.id === 'endpoint-alpha' ? [-0.8, 0.02, 0] : [-0.18, 0.08, 0]}
        >
          <Html occlude={false}>
            <div className={`service-site-anchor service-site-anchor--${cue.state}`}>
              <p className="service-site-anchor__eyebrow">{calloutEyebrow}</p>
              <p className="service-site-anchor__title">{calloutTitle}</p>
              <p className="service-site-anchor__meta">{calloutMeta}</p>
              <div className="service-site-anchor__trail">
                <span>Current corridor</span>
                <span className="service-site-anchor__trail-arrow">-&gt;</span>
                <span>{trailEnd}</span>
              </div>
              <p className="service-site-anchor__copy">{calloutCopy}</p>
            </div>
          </Html>
        </group>
      </Billboard>
    </>
  );
}
