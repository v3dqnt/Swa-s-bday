struct Params { time: f32, texel: vec2f, mouse: vec2f }
@group(0) @binding(0) var<uniform> params: Params;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = params.texel.y / params.texel.x;
  let p = (uv - 0.5) * vec2f(aspect, 1.0);
  let m = (params.mouse - 0.5) * vec2f(aspect, 1.0) * 0.3;
  let d = length(p - m);
  let pulse = 0.85 + 0.15 * sin(params.time * 1.5);
  let glow = clamp(0.035 / (d + 0.02) * pulse, 0.0, 1.0);
  let col = mix(vec3f(0.05, 0.02, 0.08), vec3f(1.0, 0.55, 0.6), glow);
  return vec4f(col, 1.0);
}
