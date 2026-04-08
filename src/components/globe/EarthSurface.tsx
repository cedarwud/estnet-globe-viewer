import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import {
  AdditiveBlending,
  BackSide,
  Color,
  Vector3,
  type Vector3Tuple,
} from 'three';
import type { EarthTextureSet } from '../../imagery/provider';
import {
  resolveEarthAppearanceProfile,
} from '../../imagery/earthAppearance';
import { configureEarthRuntimeTexture } from '../../imagery/earthTextureRuntime';

interface EarthSurfaceBaseProps {
  radius: number;
}

interface EarthDaySurfaceProps extends EarthSurfaceBaseProps {
  textureSet: EarthTextureSet;
}

interface EarthDayNightSurfaceProps extends EarthSurfaceBaseProps {
  textureSet: EarthTextureSet;
  sunDirection: Vector3Tuple;
}

interface EarthAtmosphereShellProps extends EarthSurfaceBaseProps {
  textureSet: EarthTextureSet | null;
  sunDirection: Vector3Tuple;
}

const earthShaderVertex = `
varying vec2 vUv;
varying vec3 vWorldNormal;

void main() {
  vUv = uv;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const earthShaderFragment = `
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform vec3 sunDirection;
uniform float twilightWidth;
uniform float nightFloor;
uniform float nightIntensity;
uniform float twilightBoost;

varying vec2 vUv;
varying vec3 vWorldNormal;

void main() {
  vec3 normal = normalize(vWorldNormal);
  float lightDot = dot(normal, normalize(sunDirection));
  float dayFactor = clamp(lightDot, 0.0, 1.0);
  float transition = smoothstep(-twilightWidth, twilightWidth, lightDot);
  float twilight = 1.0 - smoothstep(0.0, twilightWidth * 1.35, abs(lightDot));

  vec3 dayColor = texture2D(dayMap, vUv).rgb;
  vec3 nightColor = texture2D(nightMap, vUv).rgb;

  vec3 litDay = dayColor * mix(0.2, 1.0, pow(dayFactor, 0.7));
  vec3 nightReadable = dayColor * (nightFloor + twilight * 0.06);
  nightReadable += nightColor * (nightIntensity + twilight * twilightBoost);

  vec3 color = mix(nightReadable, litDay, transition);
  color += vec3(0.02, 0.04, 0.08) * twilight * 0.35;

  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const atmosphereVertexShader = `
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const atmosphereFragmentShader = `
uniform vec3 sunDirection;
uniform vec3 dayColor;
uniform vec3 twilightColor;
uniform float rimPower;
uniform float intensity;

varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float rim = pow(clamp(1.0 - max(dot(viewDirection, normal), 0.0), 0.0, 1.0), rimPower);
  float sunDot = dot(normal, normalize(sunDirection));
  float dayScatter = smoothstep(-0.2, 0.65, sunDot);
  float twilight = 1.0 - smoothstep(0.05, 0.45, abs(sunDot));

  vec3 color = mix(dayColor, twilightColor, twilight * 0.58);
  float opacity = rim * intensity * (0.28 + dayScatter * 0.55 + twilight * 0.24);

  gl_FragColor = vec4(color, opacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function PlaceholderEarthSurface({ radius }: EarthSurfaceBaseProps) {
  return (
    <mesh name="earth-placeholder-surface">
      <sphereGeometry args={[radius, 96, 96]} />
      <meshStandardMaterial
        color="#0f223a"
        emissive={new Color('#1f466d')}
        emissiveIntensity={0.42}
        roughness={0.84}
        metalness={0.08}
      />
    </mesh>
  );
}

export function EarthDaySurface({ radius, textureSet }: EarthDaySurfaceProps) {
  const { gl } = useThree();
  const appearanceProfile = useMemo(
    () => resolveEarthAppearanceProfile(textureSet),
    [textureSet]
  );
  const dayTexture = useTexture(textureSet.dayTextureUrl ?? '');
  const configuredDayTexture = useMemo(
    () =>
      configureEarthRuntimeTexture(
        dayTexture,
        gl.capabilities.getMaxAnisotropy(),
        appearanceProfile
      ),
    [appearanceProfile, dayTexture, gl]
  );

  return (
    <mesh name="earth-day-surface">
      <sphereGeometry
        args={[radius, appearanceProfile.surfaceSegments, appearanceProfile.surfaceSegments]}
      />
      <meshStandardMaterial
        map={configuredDayTexture}
        color="#ffffff"
        emissive={new Color('#05070a')}
        emissiveIntensity={0.03}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

export function EarthDayNightSurface({
  radius,
  textureSet,
  sunDirection,
}: EarthDayNightSurfaceProps) {
  const { gl } = useThree();
  const appearanceProfile = useMemo(
    () => resolveEarthAppearanceProfile(textureSet),
    [textureSet]
  );
  const [dayTexture, nightTexture] = useTexture([
    textureSet.dayTextureUrl ?? '',
    textureSet.nightTextureUrl ?? '',
  ]);

  const configuredDayTexture = useMemo(
    () =>
      configureEarthRuntimeTexture(
        dayTexture,
        gl.capabilities.getMaxAnisotropy(),
        appearanceProfile
      ),
    [appearanceProfile, dayTexture, gl]
  );
  const configuredNightTexture = useMemo(
    () =>
      configureEarthRuntimeTexture(
        nightTexture,
        gl.capabilities.getMaxAnisotropy(),
        appearanceProfile
      ),
    [appearanceProfile, gl, nightTexture]
  );
  const normalizedSunDirection = useMemo(
    () => new Vector3(...sunDirection).normalize(),
    [sunDirection]
  );
  const uniforms = useMemo(
    () => ({
      dayMap: { value: configuredDayTexture },
      nightMap: { value: configuredNightTexture },
      // Step 2 keeps the control surface explicit: the terminator comes from a
      // named sun direction, not from extra ambient fill hidden elsewhere.
      sunDirection: { value: normalizedSunDirection },
      twilightWidth: { value: appearanceProfile.dayNight.twilightWidth },
      nightFloor: { value: appearanceProfile.dayNight.nightFloor },
      nightIntensity: { value: appearanceProfile.dayNight.nightIntensity },
      twilightBoost: { value: appearanceProfile.dayNight.twilightBoost },
    }),
    [appearanceProfile, configuredDayTexture, configuredNightTexture, normalizedSunDirection]
  );

  return (
    <mesh name="earth-day-night-surface">
      <sphereGeometry
        args={[radius, appearanceProfile.surfaceSegments, appearanceProfile.surfaceSegments]}
      />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={earthShaderVertex}
        fragmentShader={earthShaderFragment}
      />
    </mesh>
  );
}

export function EarthAtmosphereShell({
  radius,
  textureSet,
  sunDirection,
}: EarthAtmosphereShellProps) {
  const appearanceProfile = useMemo(
    () => resolveEarthAppearanceProfile(textureSet),
    [textureSet]
  );
  const normalizedSunDirection = useMemo(
    () => new Vector3(...sunDirection).normalize(),
    [sunDirection]
  );
  const uniforms = useMemo(
    () => ({
      // Step 4 keeps atmosphere procedural and restrained. This adds depth and
      // a planetary rim without introducing another approved runtime asset.
      sunDirection: { value: normalizedSunDirection },
      dayColor: { value: new Color(appearanceProfile.atmosphere.dayColor) },
      twilightColor: { value: new Color(appearanceProfile.atmosphere.twilightColor) },
      rimPower: { value: appearanceProfile.atmosphere.rimPower },
      intensity: { value: appearanceProfile.atmosphere.intensity },
    }),
    [appearanceProfile, normalizedSunDirection]
  );

  return (
    <mesh
      name="earth-atmosphere-shell"
      scale={appearanceProfile.atmosphere.shellScale}
      renderOrder={1}
    >
      <sphereGeometry
        args={[radius, appearanceProfile.surfaceSegments, appearanceProfile.surfaceSegments]}
      />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        side={BackSide}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}
