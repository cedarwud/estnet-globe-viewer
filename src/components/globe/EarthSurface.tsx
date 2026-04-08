import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import {
  AdditiveBlending,
  BackSide,
  Color,
  MathUtils,
  NormalBlending,
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

interface EarthCloudShellProps extends EarthSurfaceBaseProps {
  textureSet: EarthTextureSet;
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

const cloudVertexShader = `
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const cloudFragmentShader = `
uniform sampler2D cloudMap;
uniform vec3 sunDirection;
uniform float opacity;
uniform float densityThreshold;
uniform float densitySoftness;
uniform float dayBoost;
uniform float nightFloor;
uniform float limbFadeExponent;

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 texel = texture2D(cloudMap, vUv).rgb;
  float luminance = dot(texel, vec3(0.299, 0.587, 0.114));
  float density = smoothstep(
    densityThreshold,
    min(1.0, densityThreshold + densitySoftness),
    luminance
  );
  density *= density;

  vec3 normal = normalize(vWorldNormal);
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float sunDot = dot(normal, normalize(sunDirection));
  float dayScatter = smoothstep(-0.12, 0.4, sunDot);
  float twilight = 1.0 - smoothstep(0.04, 0.32, abs(sunDot));
  float viewFacing = clamp(dot(viewDirection, normal), 0.0, 1.0);
  float limbFade = mix(0.64, 1.0, pow(viewFacing, limbFadeExponent));

  float shellOpacity = opacity * density * limbFade;
  shellOpacity *= mix(nightFloor, 1.0 + twilight * 0.08, dayScatter);

  vec3 nightColor = vec3(0.2, 0.23, 0.28) * (0.9 + twilight * 0.2);
  vec3 dayColor = vec3(0.93, 0.96, 1.0) * (0.72 + dayScatter * dayBoost);
  vec3 color = mix(nightColor, dayColor, dayScatter);
  color *= mix(0.68, 1.06, luminance);

  gl_FragColor = vec4(color, shellOpacity);
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
      renderOrder={2}
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

export function EarthCloudShell({
  radius,
  textureSet,
  sunDirection,
}: EarthCloudShellProps) {
  const { gl } = useThree();
  const appearanceProfile = useMemo(
    () => resolveEarthAppearanceProfile(textureSet),
    [textureSet]
  );
  const cloudTexture = useTexture(textureSet.cloudTextureUrl ?? '');
  const configuredCloudTexture = useMemo(
    () =>
      configureEarthRuntimeTexture(
        cloudTexture,
        gl.capabilities.getMaxAnisotropy(),
        appearanceProfile
      ),
    [appearanceProfile, cloudTexture, gl]
  );
  const normalizedSunDirection = useMemo(
    () => new Vector3(...sunDirection).normalize(),
    [sunDirection]
  );
  const cloudRotation = useMemo(
    () => MathUtils.degToRad(appearanceProfile.clouds.rotationDeg),
    [appearanceProfile]
  );
  const uniforms = useMemo(
    () => ({
      // Commit 2 keeps the cloud shell as a controlled, truth-adjacent visual layer.
      // The texture is approved and traceable, but the shell stays quiet enough that
      // endpoint / relay / corridor readability still wins over atmosphere theater.
      cloudMap: { value: configuredCloudTexture },
      sunDirection: { value: normalizedSunDirection },
      opacity: { value: appearanceProfile.clouds.opacity },
      densityThreshold: { value: appearanceProfile.clouds.densityThreshold },
      densitySoftness: { value: appearanceProfile.clouds.densitySoftness },
      dayBoost: { value: appearanceProfile.clouds.dayBoost },
      nightFloor: { value: appearanceProfile.clouds.nightFloor },
      limbFadeExponent: { value: appearanceProfile.clouds.limbFadeExponent },
    }),
    [appearanceProfile, configuredCloudTexture, normalizedSunDirection]
  );

  return (
    <mesh
      name="earth-cloud-shell"
      scale={appearanceProfile.clouds.shellScale}
      rotation={[0, cloudRotation, 0]}
      renderOrder={1}
    >
      <sphereGeometry
        args={[radius, appearanceProfile.surfaceSegments, appearanceProfile.surfaceSegments]}
      />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={cloudVertexShader}
        fragmentShader={cloudFragmentShader}
        transparent
        depthWrite={false}
        blending={NormalBlending}
      />
    </mesh>
  );
}
