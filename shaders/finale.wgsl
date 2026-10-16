// The ending: a purple festival night over the mountains. Rockets rise on wavy
// trails and burst into golden chrysanthemums, magenta/violet peonies, curly cyan
// willows and small yellow rings; the clouds and ridges pick up their light.
// uv is top-origin, so y grows downward.
struct Params { time: f32, reveal: f32, texel: vec2f }
@group(0) @binding(0) var<uniform> params: Params;

const BG = vec3f(0.067, 0.141, 0.035); // her green, so the scene opens out of the story
const GOLD = vec3f(1.0, 0.72, 0.28);
const MAGENTA = vec3f(1.0, 0.3, 0.86);
const CYAN = vec3f(0.3, 0.95, 0.92);
const VIOLET = vec3f(0.68, 0.42, 1.0);
const YELLOW = vec3f(1.0, 0.93, 0.45);

fn hash(n: f32) -> f32 { return fract(sin(n * 127.1) * 43758.5453); }

fn hash2(p: vec2f) -> f32 {
  var q = fract(p * vec2f(123.34, 456.21));
  q += dot(q, q + 45.32);
  return fract(q.x * q.y);
}

fn vnoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2f(1.0, 0.0)), u.x), mix(hash2(i + vec2f(0.0, 1.0)), hash2(i + vec2f(1.0, 1.0)), u.x), u.y);
}

fn fbm(p0: vec2f) -> f32 {
  var p = p0;
  var v = 0.0;
  var a = 0.5;
  for (var i = 0; i < 3; i++) {
    v += a * vnoise(p);
    p = p * 2.1 + vec2f(3.1, 1.7);
    a *= 0.5;
  }
  return v;
}

// distance from p to the segment a→b
fn seg(p: vec2f, a: vec2f, b: vec2f) -> f32 {
  let ab = b - a;
  let h = clamp(dot(p - a, ab) / max(dot(ab, ab), 1.0e-6), 0.0, 1.0);
  return length(p - a - ab * h);
}

struct Light { col: vec3f, glow: vec3f }

const RISE: f32 = 0.9; // seconds a rocket climbs before it bursts
const LIFE: f32 = 2.8; // seconds a burst lasts

fn fireworks(p: vec2f, asp: f32, time: f32) -> Light {
  var out: Light;
  out.col = vec3f(0.0);
  out.glow = vec3f(0.0);
  for (var b = 0; b < 10; b++) {
    let fb = f32(b);
    let period = 3.6 + fb * 0.33;
    let cyc = time / period + fb * 0.37;
    let age = fract(cyc) * period;
    let seed = fb * 17.3 + floor(cyc) * 9.1;
    var kind = floor(hash(seed + 7.0) * 5.0); // 0 chrysanthemum, 1 peony, 2 willow, 3 ring
    if (kind == 4.0) { kind = 1.0; } // peonies twice as often
    let c = vec2f((hash(seed) - 0.5) * asp * 0.92, 0.1 + 0.36 * hash(seed + 3.0));

    if (age < RISE) {
      // the rocket: a wavy white streak climbing towards the burst point
      let k = age / RISE;
      let headY = 1.0 - (1.0 - c.y) * (1.0 - (1.0 - k) * (1.0 - k));
      if (p.y > headY && p.y < headY + 0.16) {
        let wob = c.x + 0.007 * sin(p.y * 80.0 + time * 18.0 + fb);
        let along = 1.0 - (p.y - headY) / 0.16;
        out.col += vec3f(1.0, 0.95, 0.85) * smoothstep(0.0035, 0.0, abs(p.x - wob)) * along * 0.9;
      }
      out.col += vec3f(1.0, 0.9, 0.7) * exp(-dot(p - vec2f(c.x, headY), p - vec2f(c.x, headY)) * 9000.0);
      continue;
    }

    let a = age - RISE;
    if (a > LIFE) { continue; }
    let fade = pow(1.0 - a / LIFE, 1.6) * smoothstep(0.0, 0.04, a);
    var col = GOLD;
    var radius = 0.17 + 0.09 * hash(seed + 5.0);
    var n = 34;
    if (kind == 1.0) { col = select(MAGENTA, VIOLET, hash(seed + 11.0) > 0.5); }
    if (kind == 2.0) { col = CYAN; radius *= 1.1; }
    if (kind == 3.0) { col = YELLOW; radius *= 0.55; n = 24; }
    let spread = radius * (1.0 - exp(-a * 3.2));
    let gravity = vec2f(0.0, select(0.035, 0.08, kind == 2.0) * a * a);

    for (var i = 0; i < 34; i++) {
      if (i >= n) { break; }
      let fi = f32(i);
      var ang = 6.2832 * fi / f32(n) + hash(seed + fi) * 0.18;
      if (kind == 2.0) { ang += sin(a * 5.0 + fi * 1.7) * 0.35 * a; } // willows curl
      let sp = select(0.7 + 0.3 * hash(seed + fi * 3.1), 1.0, kind == 3.0);
      let dir = vec2f(cos(ang), sin(ang));
      let head = c + dir * spread * sp + gravity;
      var d = length(p - head);
      if (kind == 0.0 || kind == 2.0) {
        // chrysanthemums and willows leave long glowing trails back towards the centre
        let tail = c + dir * spread * sp * select(0.45, 0.6, kind == 2.0) + gravity * 0.5;
        d = seg(p, tail, head);
      }
      let tw = 0.7 + 0.3 * sin(a * 28.0 + fi * 4.0);
      out.col += col * (1.6e-5 / (d * d + 1.6e-5)) * fade * tw * 0.8;
      if (kind == 1.0) {
        // peonies get a pale inner layer
        let inner = length(p - (c + dir * spread * sp * 0.55 + gravity));
        out.col += mix(col, vec3f(1.0), 0.5) * (1.0e-5 / (inner * inner + 1.0e-5)) * fade * 0.7;
      }
    }
    let r = length(p - c);
    out.col += col * exp(-r * r * 30.0) * 0.3 * fade + vec3f(1.0, 0.95, 0.85) * exp(-a * 9.0) * exp(-r * r * 400.0);
    out.glow += col * fade * exp(-r * 3.0);
  }
  return out;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let asp = params.texel.y / params.texel.x;
  let time = params.time;
  let p = vec2f((uv.x - 0.5) * asp, uv.y);

  // sky: deep indigo above, warmer purple-magenta near the mountains
  var col = mix(vec3f(0.025, 0.022, 0.09), vec3f(0.16, 0.08, 0.24), smoothstep(0.0, 1.0, uv.y));
  col += vec3f(0.35, 0.1, 0.25) * pow(uv.y, 6.0) * 0.5;

  // stars
  let g = p * 90.0;
  let cell = floor(g);
  let s = hash2(cell);
  let f = fract(g) - 0.5;
  col += vec3f(step(0.975, s) * exp(-dot(f, f) * 50.0) * (0.55 + 0.45 * sin(time * 2.0 + s * 60.0)) * (1.0 - uv.y * 0.8));

  let fw = fireworks(p, asp, time);

  // drifting clouds, lit by whatever is bursting near them
  let cl = fbm(vec2f(p.x * 2.2 + time * 0.012, uv.y * 6.0));
  let band = smoothstep(0.45, 0.7, uv.y) * smoothstep(0.92, 0.75, uv.y);
  let cloud = smoothstep(0.5, 0.72, cl) * band;
  col = mix(col, col * 1.6 + fw.glow * 0.45 + vec3f(0.05, 0.03, 0.07), cloud * 0.7);

  col += fw.col;

  // mountain ridges: a hazy far range and a dark near one, rim-lit by the bursts
  let far = 0.83 + 0.035 * sin(p.x * 3.0 + 2.0) + 0.02 * sin(p.x * 8.1);
  let near = 0.88 + 0.03 * sin(p.x * 2.3 + 1.0) + 0.018 * sin(p.x * 7.3) + 0.008 * sin(p.x * 19.0);
  if (uv.y > far) { col = mix(col, vec3f(0.12, 0.07, 0.17) + fw.glow * 0.06, 0.85); }
  if (uv.y > near) {
    let rim = smoothstep(0.012, 0.0, uv.y - near);
    col = vec3f(0.035, 0.025, 0.06) + (fw.glow * 0.5 + vec3f(0.5, 0.25, 0.4)) * rim * 0.35;
  }

  let v = uv - 0.5;
  col *= 1.0 - 0.7 * dot(v, v);
  col = 1.0 - exp(-col * 1.4);
  return vec4f(mix(BG, col, params.reveal), 1.0);
}
