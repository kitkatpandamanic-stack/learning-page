"use client";

import * as React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { seededRandom } from "@/lib/random";

// A glowing particle sphere with a fresnel core, a wireframe shell and two
// orbit rings. Everything is additive-blended so overlapping parts glow.

const SURFACE = 6000;
const DUST = 1800;
const PARTICLES = SURFACE + DUST;
const RADIUS = 1.55;

const VIOLET = new THREE.Color("#8b5cf6");
const CYAN = new THREE.Color("#22d3ee");
const PINK = new THREE.Color("#f472b6");

function useParticleGeometry() {
  return React.useMemo(() => {
    const positions = new Float32Array(PARTICLES * 3);
    const colors = new Float32Array(PARTICLES * 3);
    const seeds = new Float32Array(PARTICLES);
    const golden = Math.PI * (3 - Math.sqrt(5));
    const color = new THREE.Color();
    const random = seededRandom(7);

    for (let i = 0; i < PARTICLES; i++) {
      const isDust = i >= SURFACE;
      // Fibonacci sphere for an even spread, with a wavy "brain-like" surface;
      // the dust particles float loosely around it.
      const y = isDust ? random() * 2 - 1 : 1 - (i / (SURFACE - 1)) * 2;
      const ring = Math.sqrt(1 - y * y);
      const theta = isDust ? random() * Math.PI * 2 : golden * i;
      const x = Math.cos(theta) * ring;
      const z = Math.sin(theta) * ring;
      const wave =
        0.07 * Math.sin(x * 9 + y * 4) * Math.cos(z * 7 - y * 5) +
        (i % 7 === 0 ? 0.12 : 0);
      const r = isDust ? RADIUS + 0.25 + random() ** 2 * 1.1 : RADIUS + wave;

      positions.set([x * r, y * r, z * r], i * 3);

      // Violet at the top, cyan at the bottom, pink on the right side
      color.copy(VIOLET).lerp(CYAN, (1 - y) / 2);
      color.lerp(PINK, Math.max(0, x) * 0.55);
      colors.set([color.r, color.g, color.b], i * 3);

      // Seeds above 1 mark dust: drawn smaller and dimmer in the shader
      seeds[i] = ((i * 0.618034) % 1) + (isDust ? 1 : 0);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));
    return geometry;
  }, []);
}

const particleShader = {
  uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
  vertexShader: /* glsl */ `
    uniform float uTime;
    uniform float uPixelRatio;
    attribute float seed;
    varying vec3 vColor;
    varying float vTwinkle;
    void main() {
      float dust = step(1.0, seed);
      float s = fract(seed);
      vColor = color;
      vec3 p = position * (1.0 + 0.025 * sin(uTime * 1.2 + s * 6.2831));
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      vTwinkle = (0.6 + 0.4 * sin(uTime * 2.0 + s * 40.0)) * mix(1.0, 0.45, dust);
      gl_PointSize = (3.5 + s * 4.5) * mix(1.0, 0.6, dust) * uPixelRatio * (4.0 / -mv.z);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vColor;
    varying float vTwinkle;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float alpha = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(vColor * 1.8, alpha * vTwinkle);
    }
  `,
};

const fresnelShader = {
  uniforms: {
    uColorA: { value: VIOLET },
    uColorB: { value: CYAN },
  },
  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vView;
    varying float vY;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vNormal = normalize(normalMatrix * normal);
      vView = normalize(-mv.xyz);
      vY = position.y;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    varying vec3 vNormal;
    varying vec3 vView;
    varying float vY;
    void main() {
      float rim = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.4);
      vec3 col = mix(uColorB, uColorA, smoothstep(-1.0, 1.0, vY));
      gl_FragColor = vec4(col, rim * 0.75 + 0.015);
    }
  `,
};

function Orb({ animate }: { animate: boolean }) {
  const group = React.useRef<THREE.Group>(null);
  const shell = React.useRef<THREE.Mesh>(null);
  const ringA = React.useRef<THREE.Group>(null);
  const ringB = React.useRef<THREE.Group>(null);
  const material = React.useRef<THREE.ShaderMaterial>(null);
  const geometry = useParticleGeometry();
  const uniforms = React.useMemo(
    () => THREE.UniformsUtils.clone(particleShader.uniforms),
    [],
  );

  useFrame(({ clock, pointer, gl }, delta) => {
    if (material.current) {
      material.current.uniforms.uPixelRatio.value = gl.getPixelRatio();
      if (animate) material.current.uniforms.uTime.value = clock.elapsedTime;
    }
    if (!animate || !group.current) return;

    group.current.rotation.y += delta * 0.12;
    // Gently tilt towards the pointer
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      pointer.y * 0.25,
      0.04,
    );
    group.current.position.x = THREE.MathUtils.lerp(
      group.current.position.x,
      pointer.x * 0.12,
      0.04,
    );
    if (shell.current) shell.current.rotation.y -= delta * 0.2;
    if (ringA.current) ringA.current.rotation.z += delta * 0.35;
    if (ringB.current) ringB.current.rotation.z -= delta * 0.25;
  });

  return (
    <group ref={group}>
      <points geometry={geometry}>
        <shaderMaterial
          ref={material}
          args={[{ ...particleShader, uniforms }]}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Glowing core */}
      <mesh>
        <sphereGeometry args={[1.12, 64, 64]} />
        <shaderMaterial
          args={[fresnelShader]}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Wireframe shell */}
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.28, 2]} />
        <meshBasicMaterial
          color="#a78bfa"
          wireframe
          transparent
          opacity={0.07}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Orbit rings with a small satellite each */}
      <group rotation={[Math.PI / 2.4, 0.3, 0]}>
        <group ref={ringA}>
          <mesh>
            <torusGeometry args={[2.15, 0.006, 8, 160]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.55} />
          </mesh>
          <mesh position={[2.15, 0, 0]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#22d3ee" />
          </mesh>
        </group>
      </group>
      <group rotation={[Math.PI / 1.8, -0.5, 0.4]}>
        <group ref={ringB}>
          <mesh>
            <torusGeometry args={[2.45, 0.005, 8, 160]} />
            <meshBasicMaterial color="#f472b6" transparent opacity={0.4} />
          </mesh>
          <mesh position={[-2.45, 0, 0]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshBasicMaterial color="#f472b6" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function OrbScene() {
  const [animate, setAnimate] = React.useState(true);

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAnimate(!query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={animate ? "always" : "demand"}
    >
      <Orb animate={animate} />
    </Canvas>
  );
}
