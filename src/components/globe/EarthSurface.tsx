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
  sunDirection: Vector3;
}

interface EarthAtmosphereShellProps extends EarthSurfaceBaseProps {
  textureSet: EarthTextureSet | null;
  sunDirection: Vector3;
}

interface EarthCloudShellProps extends EarthSurfaceBaseProps {
  textureSet: EarthTextureSet;
  sunDirection: Vector3;
}

const earthShaderVertex = `
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

const earthShaderFragment = `
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D cloudMap;
uniform vec3 sunDirection;
uniform float twilightWidth;
uniform float nightFloor;
uniform float nightIntensity;
uniform float twilightBoost;
uniform float dayContrast;
uniform float daySaturation;
uniform float dayLift;
uniform float landWarmth;
uniform float oceanTintStrength;
uniform float nightSaturation;
uniform float twilightBlueMix;
uniform float oceanMaskThreshold;
uniform float oceanMaskSoftness;
uniform float oceanSpecularStrength;
uniform float oceanSpecularSharpness;
uniform float oceanFresnelStrength;
uniform float cloudOcclusionStrength;

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

float colorLuminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

vec3 applySaturation(vec3 color, float amount) {
  float luminance = colorLuminance(color);
  return mix(vec3(luminance), color, amount);
}

vec3 applyContrast(vec3 color, float contrast) {
  return clamp((color - 0.5) * contrast + 0.5, 0.0, 1.0);
}

float buildOceanMask(vec3 dayColor, float threshold, float softness) {
  float maxChannel = max(max(dayColor.r, dayColor.g), dayColor.b);
  float minChannel = min(min(dayColor.r, dayColor.g), dayColor.b);
  float saturation = maxChannel - minChannel;
  float luminance = colorLuminance(dayColor);
  float blueDominance = dayColor.b - max(dayColor.r * 0.92, dayColor.g * 0.98);
  float coolness = dayColor.b - dayColor.r * 0.65;
  float oceanSignal = blueDominance + saturation * 0.22 + coolness * 0.16 - luminance * 0.02;
  float oceanMask = smoothstep(threshold, threshold + softness, oceanSignal);
  float landSignal = max(
    smoothstep(0.015, 0.14, dayColor.g - dayColor.b * 0.82),
    smoothstep(0.015, 0.16, dayColor.r - dayColor.b * 0.94)
  );
  float brightLand = smoothstep(0.42, 0.82, luminance) * (1.0 - saturation * 0.55);
  return clamp(oceanMask * (1.0 - landSignal * 0.82 - brightLand * 0.22), 0.0, 1.0);
}

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 lightDirection = normalize(sunDirection);
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float viewFacing = clamp(dot(viewDirection, normal), 0.0, 1.0);
  float lightDot = dot(normal, lightDirection);

  float dayFactor = smoothstep(-twilightWidth, twilightWidth, lightDot);
  float twilight = smoothstep(0.0, twilightWidth * 1.4, twilightWidth - abs(lightDot));
  float limbDarken = mix(0.88, 1.0, pow(viewFacing, 0.35));

  vec3 dayColor = texture2D(dayMap, vUv).rgb;
  vec3 nightColor = texture2D(nightMap, vUv).rgb;
  vec3 cloudColor = texture2D(cloudMap, vUv).rgb;
  float oceanMask = buildOceanMask(dayColor, oceanMaskThreshold, oceanMaskSoftness);
  float landMask = 1.0 - oceanMask;
  float cloudLuminance = colorLuminance(cloudColor);
  float cloudCoverage = smoothstep(0.38, 0.76, cloudLuminance);

  vec3 gradedDay = applySaturation(dayColor, daySaturation);
  gradedDay = mix(gradedDay, gradedDay * vec3(1.03, 1.01, 0.98), landMask * landWarmth);
  vec3 oceanTintedDay =
    clamp(gradedDay * vec3(0.76, 1.02, 1.34) + vec3(0.01, 0.022, 0.06), 0.0, 1.0);
  gradedDay = mix(gradedDay, oceanTintedDay, oceanMask * oceanTintStrength);
  gradedDay = pow(gradedDay, vec3(0.96));
  gradedDay = applyContrast(gradedDay, dayContrast);
  gradedDay = clamp(gradedDay + vec3(dayLift), 0.0, 1.0);

  vec3 gradedNight = applySaturation(nightColor, nightSaturation);
  gradedNight *= vec3(1.0, 0.95, 0.85);

  vec3 litDay = gradedDay * (1.02 + 0.14 * dayFactor) * limbDarken;
  litDay = mix(
    litDay,
    litDay * vec3(0.995, 1.025, 1.07) + vec3(0.0, 0.008, 0.02),
    oceanMask * (0.055 + dayFactor * 0.03)
  );

  vec3 nightBase = gradedDay * nightFloor;
  vec3 nightLights = gradedNight * nightIntensity * limbDarken;
  vec3 nightSurface = nightBase + nightLights;

  vec3 color = mix(nightSurface, litDay, dayFactor);
  color += vec3(0.008, 0.01, 0.014) * viewFacing * dayFactor * 0.5;

  vec3 halfVector = normalize(lightDirection + viewDirection);
  float specular = pow(max(dot(normal, halfVector), 0.0), oceanSpecularSharpness);
  float fresnel = pow(1.0 - clamp(dot(viewDirection, normal), 0.0, 1.0), 3.0);
  float daylightGate = smoothstep(0.14, 0.58, lightDot);
  float cloudOcclusion = 1.0 - cloudCoverage * cloudOcclusionStrength;
  float oceanHighlight = oceanMask * daylightGate * cloudOcclusion;
  oceanHighlight *= specular * oceanSpecularStrength + fresnel * oceanFresnelStrength * 0.32;
  color += vec3(0.88, 0.95, 1.0) * oceanHighlight;

  color += vec3(0.012, 0.025, 0.05) * twilight * twilightBlueMix;
  color += vec3(0.006, 0.01, 0.018) * twilight * twilightBoost;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
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
  float dayScatter = smoothstep(-0.16, 0.72, sunDot);
  float twilight = 1.0 - smoothstep(0.02, 0.34, abs(sunDot));

  vec3 color = mix(dayColor, twilightColor, twilight * 0.58);
  float opacity = rim * intensity * (0.22 + dayScatter * 0.64 + twilight * 0.14);

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
  const [dayTexture, nightTexture, cloudTexture] = useTexture([
    textureSet.dayTextureUrl ?? '',
    textureSet.nightTextureUrl ?? '',
    textureSet.cloudTextureUrl ?? textureSet.dayTextureUrl ?? textureSet.nightTextureUrl ?? '',
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
  const configuredCloudTexture = useMemo(
    () =>
      configureEarthRuntimeTexture(
        cloudTexture,
        gl.capabilities.getMaxAnisotropy(),
        appearanceProfile
    ),
    [appearanceProfile, cloudTexture, gl]
  );
  const uniforms = useMemo(
    () => ({
      dayMap: { value: configuredDayTexture },
      nightMap: { value: configuredNightTexture },
      cloudMap: { value: configuredCloudTexture },
      // Step 2 keeps the control surface explicit: the terminator comes from a
      // named sun direction, not from extra ambient fill hidden elsewhere.
      sunDirection: { value: sunDirection },
      twilightWidth: { value: appearanceProfile.dayNight.twilightWidth },
      nightFloor: { value: appearanceProfile.dayNight.nightFloor },
      nightIntensity: { value: appearanceProfile.dayNight.nightIntensity },
      twilightBoost: { value: appearanceProfile.dayNight.twilightBoost },
      dayContrast: { value: appearanceProfile.surfaceGrading.dayContrast },
      daySaturation: { value: appearanceProfile.surfaceGrading.daySaturation },
      dayLift: { value: appearanceProfile.surfaceGrading.dayLift },
      landWarmth: { value: appearanceProfile.surfaceGrading.landWarmth },
      oceanTintStrength: { value: appearanceProfile.surfaceGrading.oceanTintStrength },
      nightSaturation: { value: appearanceProfile.surfaceGrading.nightSaturation },
      twilightBlueMix: { value: appearanceProfile.surfaceGrading.twilightBlueMix },
      oceanMaskThreshold: { value: appearanceProfile.ocean.maskThreshold },
      oceanMaskSoftness: { value: appearanceProfile.ocean.maskSoftness },
      oceanSpecularStrength: { value: appearanceProfile.ocean.specularStrength },
      oceanSpecularSharpness: { value: appearanceProfile.ocean.specularSharpness },
      oceanFresnelStrength: { value: appearanceProfile.ocean.fresnelStrength },
      cloudOcclusionStrength: {
        value: textureSet.cloudTextureUrl ? appearanceProfile.ocean.cloudOcclusionStrength : 0,
      },
    }),
    [
      appearanceProfile,
      configuredCloudTexture,
      configuredDayTexture,
      configuredNightTexture,
      sunDirection,
      textureSet.cloudTextureUrl,
    ]
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
  const uniforms = useMemo(
    () => ({
      // Step 4 keeps atmosphere procedural and restrained. This adds depth and
      // a planetary rim without introducing another approved runtime asset.
      sunDirection: { value: sunDirection },
      dayColor: { value: new Color(appearanceProfile.atmosphere.dayColor) },
      twilightColor: { value: new Color(appearanceProfile.atmosphere.twilightColor) },
      rimPower: { value: appearanceProfile.atmosphere.rimPower },
      intensity: { value: appearanceProfile.atmosphere.intensity },
    }),
    [appearanceProfile, sunDirection]
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
      sunDirection: { value: sunDirection },
      opacity: { value: appearanceProfile.clouds.opacity },
      densityThreshold: { value: appearanceProfile.clouds.densityThreshold },
      densitySoftness: { value: appearanceProfile.clouds.densitySoftness },
      dayBoost: { value: appearanceProfile.clouds.dayBoost },
      nightFloor: { value: appearanceProfile.clouds.nightFloor },
      limbFadeExponent: { value: appearanceProfile.clouds.limbFadeExponent },
    }),
    [appearanceProfile, configuredCloudTexture, sunDirection]
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
