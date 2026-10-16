// Festival night by the water: fireworks, strung lanterns, a warm horizon glow
// and a rippling reflection. uv is top-origin, so y grows downward.
struct Params { time: f32, reveal: f32, texel: vec2f }
@group(0) @binding(0) var<uniform> params: Params;

const HORIZON: f32 = 0.62;
const BG = vec3f(0.027, 0.078, 0.059);
const GOLD = vec3f(1.0, 0.82, 0.48);
const CHAMPAGNE = vec3f(0.96, 0.9, 0.78);
const EMERALD = vec3f(0.3, 0.85, 0.55);
const JADE = vec3f(0.6, 0.95, 0.8);

fn hash(n: f32) -> f32 { return fract(sin(n * 127.1) * 43758.5453); }

fn palette(h: f32) -> vec3f {
  var col = mix(GOLD, CHAMPAGNE, step(0.3, h));
  col = mix(col, EMERALD, step(0.6, h));
  return mix(col, JADE, step(0.85, h));
}

fn fireworks(q: vec2f, asp: f32, time: f32) -> vec3f {
  var acc = vec3f(0.0);
  for (var b = 0; b < 5; b++) {
    let fb = f32(b);
    let period = 4.2 + fb * 0.35;
    let cyc = time / period + fb * 0.37;
    let age = fract(cyc) * period;
    let life = 2.4;
    if (age < life) {
      let seed = fb * 13.1 + floor(cyc) * 7.7;
      let c = vec2f((hash(seed) - 0.5) * asp * 0.8, 0.10 + 0.25 * hash(seed + 3.0));
      let radius = (0.16 + 0.09 * hash(seed + 5.0)) * (1.0 - exp(-age * 3.2));
      let col = palette(hash(seed + 9.0));
      let fade = pow(1.0 - age / life, 2.0) * smoothstep(0.0, 0.05, age);
      for (var i = 0; i < 30; i++) {
        let fi = f32(i);
        let a = 6.2832 * fi / 30.0 + hash(seed + fi) * 0.25;
        let sp = 0.65 + 0.35 * hash(seed + fi * 3.1);
        let pos = c + vec2f(cos(a), sin(a)) * radius * sp + vec2f(0.0, 0.05 * age * age);
        let d = q - pos;
        let tw = 0.75 + 0.25 * sin(age * 30.0 + fi * 5.0);
        acc += col * (2.0e-5 / (dot(d, d) + 2.0e-5)) * fade * tw * 0.6;
      }
      acc += col * exp(-age * 6.0) * 0.25 / (length(q - c) * 8.0 + 1.0);
    }
  }
  return acc;
}

fn lantern_string(q: vec2f, a: vec2f, b: vec2f, sag: f32, n: i32, time: f32) -> vec3f {
  var acc = vec3f(0.0);
  var prev = a;
  for (var i = 0; i < n; i++) {
    let t = f32(i) / f32(n - 1);
    var p = mix(a, b, t) + vec2f(0.0, sag * 4.0 * t * (1.0 - t));
    p.x += sin(time * 0.9 + f32(i) * 1.7) * 0.003;
    p.y += 0.014 + sin(time * 1.1 + f32(i) * 2.3) * 0.002;
    let ab = p - prev;
    let h = clamp(dot(q - prev, ab) / max(dot(ab, ab), 1.0e-6), 0.0, 1.0);
    acc += vec3f(0.95, 0.82, 0.6) * 0.12 * exp(-length(q - prev - ab * h) * 350.0);
    let d2 = dot(q - p, q - p);
    let flick = 0.9 + 0.1 * sin(time * 3.0 + f32(i) * 4.0);
    acc += vec3f(1.0, 0.78, 0.45) * flick * (0.9 * exp(-d2 * 8000.0) + 0.6 * 3.0e-4 / (d2 + 4.0e-4));
    prev = p;
  }
  return acc;
}

fn sky(q: vec2f, asp: f32, time: f32) -> vec3f {
  let t = clamp(q.y / HORIZON, 0.0, 1.0);
  var col = mix(vec3f(0.008, 0.035, 0.025), vec3f(0.04, 0.15, 0.10), pow(t, 1.4));
  col += vec3f(0.92, 0.78, 0.52) * pow(t, 7.0) * 0.6;
  col += vec3f(0.55, 0.45, 0.25) * pow(t, 3.0) * 0.15;

  let g = q * 70.0;
  let cell = floor(g);
  let r = hash(cell.x * 17.0 + cell.y * 91.0);
  let f = fract(g) - 0.5;
  col += vec3f(step(0.985, r) * exp(-dot(f, f) * 60.0) * (0.6 + 0.4 * sin(time * 2.0 + r * 50.0)) * (1.0 - t));

  col += fireworks(q, asp, time);
  col += lantern_string(q, vec2f(-0.5 * asp, 0.30), vec2f(0.15 * asp, 0.18), 0.06, 7, time);
  col += lantern_string(q, vec2f(0.55 * asp, 0.22), vec2f(0.10 * asp, 0.08), 0.05, 6, time);
  return col;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let asp = params.texel.y / params.texel.x;
  let x = (uv.x - 0.5) * asp;
  let time = params.time;
  var col = vec3f(0.0);

  if (uv.y < HORIZON) {
    col = sky(vec2f(x, uv.y), asp, time);
    let shore = HORIZON - 0.012 - 0.01 * sin(x * 5.0 + 1.0) - 0.006 * sin(x * 13.0);
    if (uv.y > shore) {
      let lit = step(0.93, hash(floor(x * 120.0))) * vec3f(1.0, 0.82, 0.55) * 0.8;
      col = vec3f(0.01, 0.03, 0.02) + lit;
    }
  } else {
    let wy = uv.y - HORIZON;
    let mx = x + sin(wy * 110.0 + time * 1.6 + x * 25.0) * 0.006 * (wy + 0.03);
    let my = max(HORIZON - wy * 1.6, 0.0);
    col = sky(vec2f(mx, my), asp, time) * 0.5 * (1.0 - 0.8 * wy) + vec3f(0.01, 0.04, 0.03);
  }

  let v = uv - 0.5;
  col *= 1.0 - 0.8 * dot(v, v);
  col = 1.0 - exp(-col * 1.3);
  return vec4f(mix(BG, col, params.reveal), 1.0);
}
