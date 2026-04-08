import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Color, SRGBColorSpace, Texture, Vector3, type Vector3Tuple } from 'three';

interface EarthSurfaceBaseProps {
  radius: number;
}

interface EarthDaySurfaceProps extends EarthSurfaceBaseProps {
  dayTextureUrl: string;
}

interface EarthDayNightSurfaceProps extends EarthSurfaceBaseProps {
  dayTextureUrl: string;
  nightTextureUrl: string;
  sunDirection: Vector3Tuple;
}

function configureEarthTexture(texture: Texture, anisotropy: number) {
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
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

export function EarthDaySurface({ radius, dayTextureUrl }: EarthDaySurfaceProps) {
  const { gl } = useThree();
  const dayTexture = useTexture(dayTextureUrl);
  const configuredDayTexture = useMemo(
    () => configureEarthTexture(dayTexture, Math.min(gl.capabilities.getMaxAnisotropy(), 8)),
    [dayTexture, gl]
  );

  return (
    <mesh name="earth-day-surface">
      <sphereGeometry args={[radius, 96, 96]} />
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
  dayTextureUrl,
  nightTextureUrl,
  sunDirection,
}: EarthDayNightSurfaceProps) {
  const { gl } = useThree();
  const [dayTexture, nightTexture] = useTexture([dayTextureUrl, nightTextureUrl]);

  const anisotropy = Math.min(gl.capabilities.getMaxAnisotropy(), 8);
  const configuredDayTexture = useMemo(
    () => configureEarthTexture(dayTexture, anisotropy),
    [anisotropy, dayTexture]
  );
  const configuredNightTexture = useMemo(
    () => configureEarthTexture(nightTexture, anisotropy),
    [anisotropy, nightTexture]
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
      twilightWidth: { value: 0.18 },
      nightFloor: { value: 0.028 },
      nightIntensity: { value: 0.92 },
      twilightBoost: { value: 0.18 },
    }),
    [configuredDayTexture, configuredNightTexture, normalizedSunDirection]
  );

  return (
    <mesh name="earth-day-night-surface">
      <sphereGeometry args={[radius, 96, 96]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={earthShaderVertex}
        fragmentShader={earthShaderFragment}
      />
    </mesh>
  );
}
