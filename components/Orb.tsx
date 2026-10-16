"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  void main() {
    vec2 p = vUv - 0.5;
    float d = length(p - (uMouse - 0.5) * 0.15);
    float glow = 0.035 / (d + 0.02) * (0.85 + 0.15 * sin(uTime * 1.5));
    vec3 col = mix(vec3(0.05, 0.02, 0.08), vec3(1.0, 0.55, 0.6), clamp(glow, 0.0, 1.0));
    gl_FragColor = vec4(col, 1.0);
  }
`;

function Quad() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(0.5, 0.5) } }),
    []
  );
  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uMouse.value.set(state.pointer.x * 0.5 + 0.5, state.pointer.y * 0.5 + 0.5);
  });
  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} />
    </mesh>
  );
}

export default function Orb() {
  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: false }} style={{ position: "fixed", inset: 0 }}>
      <Quad />
    </Canvas>
  );
}
