// Ambient backdrop: a beige-gold light inside a slow emerald haze.
// uv is top-origin, so y grows downward.
struct Params { time: f32, progress: f32, mouse: vec2f, texel: vec2f }
@group(0) @binding(0) var<uniform> params: Params;

const BG = vec3f(0.027, 0.078, 0.059);
const EMERALD = vec3f(0.07, 0.30, 0.21);
const BEIGE = vec3f(0.91, 0.86, 0.77);

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = params.texel.y / params.texel.x;
  let t = params.time;
  let p = (uv - 0.5) * vec2f(aspect, 1.0);

  // The light drifts up and softens as she scrolls through the story.
  let center = vec2f(0.0, -0.12 * params.progress) + (params.mouse - 0.5) * vec2f(aspect, 1.0) * 0.12;
  let d = length(p - center);
  let pulse = 0.88 + 0.12 * sin(t * 1.2);
  let strength = mix(1.0, 0.65, params.progress);
  let glow = clamp(0.03 / (d + 0.025) * pulse * strength, 0.0, 1.0);

  let haze = 0.5 + 0.5 * sin(p.x * 2.6 + t * 0.15) * sin(p.y * 2.2 - t * 0.12);
  var col = BG + EMERALD * 0.35 * haze * (1.0 - clamp(length(p), 0.0, 1.0));
  col = mix(col, EMERALD, smoothstep(0.05, 0.5, glow));
  col = mix(col, BEIGE, smoothstep(0.55, 1.0, glow));
  return vec4f(col, 1.0);
}
