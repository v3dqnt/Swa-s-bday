// Living background: a grainy, slowly drifting mesh gradient built from the current
// tone, with eight crossfading worlds on top (abstract rings, city, jungle, meadow,
// silk ribbons, topographic contours, bokeh, falling petals). Layers parallax with
// the camera; the current line lights the scene behind it, sends a ripple through
// it when it lands, and fast camera flights pull light streaks past.
// uv is top-origin, so y grows downward.
struct Params {
  time: f32,
  grain: f32,
  texel: vec2f,
  base: vec4f, // current tone (rgb)
  accent: vec4f, // light green garnish colour (rgb)
  weights: vec4f, // abstract, city, jungle, meadow
  weights2: vec4f, // ribbons, topo, bokeh, petals
  cam: vec4f, // yaw deg, pitch deg, -, -
  fx: vec4f, // focus 0..1, speed 0..1, seconds since a line landed, -
}
@group(0) @binding(0) var<uniform> params: Params;

fn hash21(p: vec2f) -> f32 {
  var q = fract(p * vec2f(123.34, 456.21));
  q += dot(q, q + 45.32);
  return fract(q.x * q.y);
}

fn hash11(n: f32) -> f32 { return fract(sin(n * 127.1) * 43758.5453); }

fn vnoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm(p0: vec2f) -> f32 {
  var p = p0;
  var v = 0.0;
  var a = 0.5;
  for (var i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + vec2f(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

fn pool(q: vec2f, c: vec2f, k: f32) -> f32 {
  let d = q - c;
  return exp(-dot(d, d) * k);
}

fn mesh_gradient(uv: vec2f, asp: f32, t: f32, base: vec3f, accent: vec3f) -> vec3f {
  let p = vec2f(uv.x * asp, uv.y);
  let warp = vec2f(fbm(p * 1.4 + t * 0.05), fbm(p * 1.4 - t * 0.04 + 7.0)) - 0.5;
  let q = p + warp * 0.4;
  let light = min(base * 2.4 + vec3f(0.03, 0.04, 0.02), vec3f(1.0));
  let deep = base * 0.4;
  var col = base;
  col = mix(col, light, 0.75 * pool(q, vec2f(asp * (0.25 + 0.15 * sin(t * 0.11)), 0.22 + 0.12 * cos(t * 0.13)), 5.0));
  col = mix(col, mix(base, accent, 0.4), 0.55 * pool(q, vec2f(asp * (0.8 + 0.12 * cos(t * 0.09)), 0.38 + 0.15 * sin(t * 0.07)), 6.0));
  col = mix(col, deep, 0.8 * pool(q, vec2f(asp * (0.5 + 0.2 * sin(t * 0.06 + 2.0)), 0.88 + 0.08 * cos(t * 0.1)), 4.0));
  col = mix(col, mix(light, accent, 0.3), 0.4 * pool(q, vec2f(asp * (0.15 + 0.1 * cos(t * 0.08 + 1.0)), 0.72 + 0.1 * sin(t * 0.12)), 7.0));
  return col;
}

// Slow orbiting rings and a soft glow: the "abstract" world.
fn abstract_layer(uv: vec2f, asp: f32, t: f32, accent: vec3f, yaw: f32) -> vec4f {
  let p = vec2f((uv.x - 0.5) * asp + yaw * 0.004, uv.y - 0.5);
  var a = 0.0;
  for (var i = 0; i < 4; i++) {
    let fi = f32(i);
    let c = vec2f(0.32 * sin(t * 0.07 + fi * 2.1), 0.28 * cos(t * 0.05 + fi * 1.3));
    let r = 0.22 + fi * 0.16;
    let d = abs(length(p - c) - r);
    a += smoothstep(0.01, 0.0, d) * (0.32 - fi * 0.05);
    a += smoothstep(0.08, 0.0, d) * 0.05;
  }
  return vec4f(mix(accent, vec3f(0.95, 0.93, 0.84), 0.25), clamp(a, 0.0, 1.0));
}

// Three parallax layers of buildings with scattered lit windows.
fn city_layer(uv: vec2f, asp: f32, t: f32, base: vec3f, accent: vec3f, yaw: f32) -> vec4f {
  var col = vec3f(0.0);
  var alpha = 0.0;
  for (var l = 0; l < 3; l++) {
    let fl = f32(l);
    let n = 9.0 - fl * 2.0;
    let xs = (uv.x * asp + yaw * 0.003 * (fl + 1.0) + fl * 3.7) * n;
    let idx = floor(xs);
    let fx = fract(xs);
    let h = 0.06 + hash11(idx + fl * 37.0) * 0.18;
    let top = 0.8 - h + fl * 0.06;
    if (uv.y > top && fx > 0.06 && fx < 0.94) {
      let shade = mix(base * 1.5 + vec3f(0.02), base * 0.22, fl / 2.0);
      let wx = fract(fx * 5.0);
      let rows = (uv.y - top) * (95.0 - fl * 25.0);
      let wy = fract(rows);
      let cell = vec2f(idx * 7.0 + floor(fx * 5.0), floor(rows));
      let lit = step(0.64, hash21(cell + fl * 13.0));
      let flicker = 0.75 + 0.25 * sin(t * (1.0 + hash21(cell) * 3.0) + hash21(cell) * 6.28);
      let win = step(0.28, wx) * step(wx, 0.72) * step(0.3, wy) * step(wy, 0.78) * lit * flicker;
      let glow = mix(accent, vec3f(0.98, 0.94, 0.78), 0.55);
      col = mix(shade, glow, win * (0.55 + 0.2 * fl));
      alpha = 1.0;
    }
  }
  return vec4f(col, alpha);
}

fn leaf(q: vec2f, ang: f32, len: f32) -> vec2f {
  // returns (signed distance, |vein distance|) for an ellipse leaf starting at the origin
  let c = cos(ang);
  let s = sin(ang);
  var r = vec2f(c * q.x + s * q.y, -s * q.x + c * q.y);
  r.x -= len;
  let d = length(vec2f(r.x / len, r.y / (len * 0.34))) - 1.0;
  return vec2f(d, abs(r.y));
}

// Leaves hanging from the top edge and rising from the bottom, swaying, in depth.
fn jungle_layer(uv: vec2f, asp: f32, t: f32, base: vec3f, accent: vec3f, yaw: f32) -> vec4f {
  var col = vec3f(0.0);
  var alpha = 0.0;
  for (var l = 0; l < 3; l++) {
    let fl = f32(l);
    let cw = 0.17 + fl * 0.05; // fixed-size cells, so leaves frame the edges on any aspect
    let px = uv.x * asp + yaw * 0.004 * (fl + 1.0) + fl * 1.3;
    let ci = floor(px / cw);
    for (var o = -1; o <= 1; o++) {
      let idx = ci + f32(o);
      let fromTop = hash11(idx * 3.1 + fl) > 0.45;
      let anchor = vec2f((idx + 0.5) * cw, select(1.04, -0.04, fromTop));
      let dir = select(-1.5708, 1.5708, fromTop) + (hash11(idx * 5.3 + fl) - 0.5) * 0.6; // grow inward
      let len = (0.1 + hash11(idx + fl * 9.0) * 0.1) * (1.0 + fl * 0.3);
      let sway = sin(t * 0.6 + idx * 1.7 + fl) * 0.09;
      for (var j = 0; j < 3; j++) {
        let fj = f32(j) - 1.0;
        let lf = leaf(vec2f(px, uv.y) - anchor, dir + fj * 0.6 + sway, len * (1.0 - abs(fj) * 0.2));
        if (lf.x < 0.0) {
          let shade = mix(base * 1.7 + vec3f(0.01, 0.03, 0.0), base * 0.3, fl / 2.0);
          let vein = smoothstep(0.003, 0.0, lf.y) * 0.25;
          col = mix(shade, accent, vein + (1.0 + lf.x) * 0.06);
          alpha = 1.0;
        }
      }
    }
  }
  return vec4f(col, alpha);
}

// Rolling hills in three depths.
fn meadow_layer(uv: vec2f, asp: f32, base: vec3f, yaw: f32) -> vec4f {
  var col = vec3f(0.0);
  var alpha = 0.0;
  for (var l = 0; l < 3; l++) {
    let fl = f32(l);
    let x = uv.x * asp + yaw * 0.003 * (fl + 1.0);
    let y = 0.72 + fl * 0.08 + 0.06 * sin(x * 6.0 + fl * 1.7) + 0.03 * sin(x * 14.0 + fl * 2.9);
    if (uv.y > y) {
      // far hills are hazy and light, near ones dark; a faint lit rim on each crest
      let rim = smoothstep(0.012, 0.0, uv.y - y) * 0.25;
      col = mix(base * 2.0 + vec3f(0.02, 0.03, 0.01), base * 0.3, fl / 2.0) + vec3f(0.5, 0.75, 0.4) * rim * (1.0 - fl * 0.3);
      alpha = 1.0;
    }
  }
  return vec4f(col, alpha);
}

fn fireflies(uv: vec2f, asp: f32, t: f32, accent: vec3f) -> vec3f {
  var acc = vec3f(0.0);
  let p = vec2f(uv.x * asp, uv.y);
  for (var i = 0; i < 24; i++) {
    let fi = f32(i);
    let c = vec2f(hash11(fi) * asp + 0.04 * sin(t * 0.5 + fi), 0.25 + hash11(fi + 7.0) * 0.65 + 0.03 * cos(t * 0.4 + fi * 2.0));
    let d = p - c;
    let tw = 0.5 + 0.5 * sin(t * (1.5 + hash11(fi + 3.0) * 2.0) + fi);
    acc += mix(accent, vec3f(0.96, 0.95, 0.8), 0.5) * tw * (exp(-dot(d, d) * 9000.0) * 0.9 + 1.2e-4 / (dot(d, d) + 4.0e-4));
  }
  return acc;
}

// Three flowing silk bands with a lit edge.
fn ribbons_layer(uv: vec2f, asp: f32, t: f32, base: vec3f, accent: vec3f, yaw: f32) -> vec4f {
  var col = vec3f(0.0);
  var alpha = 0.0;
  let x = uv.x * asp;
  for (var i = 0; i < 3; i++) {
    let fi = f32(i);
    let px = x * (3.0 + fi) + yaw * 0.01 * (fi + 1.0);
    let c = 0.25 + fi * 0.25 + 0.09 * sin(px + t * (0.3 + fi * 0.07) + fi * 2.0) + 0.04 * sin(px * 2.3 - t * 0.2);
    let w = 0.035 + 0.025 * sin(px * 0.7 + t * 0.25 + fi);
    let d = (uv.y - c) / w;
    if (abs(d) < 1.0) {
      let fold = 0.5 + 0.5 * sin(px * 1.7 + t * 0.4 + fi * 3.0); // silk sheen across the band
      let shade = mix(base * 1.2, mix(accent, vec3f(0.95, 0.93, 0.84), 0.3), 0.25 + 0.45 * fold * (1.0 - d * d));
      col = shade + vec3f(0.9, 0.95, 0.8) * smoothstep(0.75, 1.0, -d) * 0.18;
      alpha = 0.85 * smoothstep(1.0, 0.85, abs(d));
    }
  }
  return vec4f(col, alpha);
}

// Topographic contour lines of a slowly shifting terrain.
fn topo_layer(uv: vec2f, asp: f32, t: f32, accent: vec3f, yaw: f32) -> vec4f {
  let p = vec2f(uv.x * asp + yaw * 0.003, uv.y) * 2.2 + vec2f(t * 0.02, -t * 0.015);
  let h = fbm(p) * 20.0;
  let f = fract(h);
  let aa = fwidth(h) * 1.2;
  let line = smoothstep(aa, 0.0, min(f, 1.0 - f));
  let major = step(0.5, fract(floor(h) * 0.25)); // every fourth line brighter
  return vec4f(mix(accent, vec3f(0.95, 0.93, 0.84), major * 0.4), line * (0.22 + major * 0.18));
}

// Soft out-of-focus light orbs rising slowly.
fn bokeh_layer(uv: vec2f, asp: f32, t: f32, accent: vec3f, yaw: f32) -> vec4f {
  let p = vec2f(uv.x * asp, uv.y);
  var a = 0.0;
  var tint = vec3f(0.0);
  for (var i = 0; i < 16; i++) {
    let fi = f32(i);
    let depth = hash11(fi + 2.0);
    let r = 0.03 + depth * 0.09;
    let c = vec2f(
      fract(hash11(fi) + yaw * 0.0015 * (depth + 0.3)) * (asp + 0.2) - 0.1,
      1.15 - fract(hash11(fi + 5.0) + t * (0.01 + 0.02 * depth)) * 1.3
    );
    let d = length(p - c);
    let disc = smoothstep(r, r * 0.8, d) * (0.08 + 0.1 * (1.0 - depth)) + smoothstep(r * 1.02, r * 0.95, d) * smoothstep(r * 0.85, r, d) * 0.12;
    a += disc;
    tint += mix(accent, vec3f(0.96, 0.94, 0.82), hash11(fi + 9.0)) * disc;
  }
  return vec4f(tint / max(a, 0.001), clamp(a, 0.0, 0.8));
}

// Petals tumbling down through depth.
fn petals_layer(uv: vec2f, asp: f32, t: f32, accent: vec3f, yaw: f32) -> vec4f {
  let p = vec2f(uv.x * asp, uv.y);
  var col = vec3f(0.0);
  var alpha = 0.0;
  for (var i = 0; i < 26; i++) {
    let fi = f32(i);
    let depth = hash11(fi + 4.0);
    let size = 0.012 + depth * 0.022;
    let fall = fract(hash11(fi + 1.0) + t * (0.02 + 0.03 * depth));
    let c = vec2f(
      fract(hash11(fi) + 0.06 * sin(t * 0.7 + fi) + yaw * 0.002 * (depth + 0.3)) * asp,
      fall * 1.2 - 0.1
    );
    let ang = t * (0.8 + hash11(fi + 6.0)) + fi;
    let flip = 0.35 + 0.65 * abs(sin(t * 1.3 + fi)); // turning in 3D
    let q = p - c;
    let r = vec2f(cos(ang) * q.x + sin(ang) * q.y, -sin(ang) * q.x + cos(ang) * q.y);
    let d = length(vec2f(r.x / (size * flip), r.y / (size * 0.55)));
    if (d < 1.0) {
      col = mix(accent, vec3f(0.97, 0.94, 0.86), 0.35 + 0.4 * hash11(fi + 8.0)) * (0.75 + 0.25 * depth);
      alpha = smoothstep(1.0, 0.8, d) * (0.45 + 0.4 * depth);
    }
  }
  return vec4f(col, alpha);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let asp = params.texel.y / params.texel.x;
  let t = params.time;
  let base = params.base.rgb;
  let accent = params.accent.rgb;
  let w = params.weights;
  let yaw = params.cam.x;

  var col = mesh_gradient(uv, asp, t, base, accent);
  if (w.x > 0.01) {
    let s = abstract_layer(uv, asp, t, accent, yaw);
    col = mix(col, s.rgb, s.a * w.x);
  }
  if (w.y > 0.01) {
    let s = city_layer(uv, asp, t, base, accent, yaw);
    col = mix(col, s.rgb, s.a * w.y);
  }
  if (w.z > 0.01) {
    let s = jungle_layer(uv, asp, t, base, accent, yaw);
    col = mix(col, s.rgb, s.a * w.z);
  }
  if (w.w > 0.01) {
    let s = meadow_layer(uv, asp, base, yaw);
    col = mix(col, s.rgb, s.a * w.w);
    col += fireflies(uv, asp, t, accent) * w.w;
  }

  let w2 = params.weights2;
  if (w2.x > 0.01) {
    let s = ribbons_layer(uv, asp, t, base, accent, yaw);
    col = mix(col, s.rgb, s.a * w2.x);
  }
  if (w2.y > 0.01) {
    let s = topo_layer(uv, asp, t, accent, yaw);
    col = mix(col, s.rgb, s.a * w2.y);
  }
  if (w2.z > 0.01) {
    let s = bokeh_layer(uv, asp, t, accent, yaw);
    col = mix(col, s.rgb, s.a * w2.z);
  }
  if (w2.w > 0.01) {
    let s = petals_layer(uv, asp, t, accent, yaw);
    col = mix(col, s.rgb, s.a * w2.w);
  }

  // The line on screen lights the scene behind it (it sits at the centre).
  let focus = params.fx.x;
  let speed = params.fx.y;
  let age = params.fx.z;
  let cpos = vec2f((uv.x - 0.5) * asp, uv.y - 0.47);
  let r = length(cpos);
  col += mix(base * 3.0, vec3f(0.94, 0.92, 0.8), 0.25) * exp(-r * r * 7.0) * 0.22 * focus;
  // ...and sends a ripple out through it when it lands.
  if (age < 2.5) {
    let ring = abs(r - age * 0.55);
    col += accent * smoothstep(0.03, 0.0, ring) * (1.0 - age / 2.5) * 0.35;
  }
  // Fast camera flights pull light streaks past, like warp speed.
  if (speed > 0.02) {
    let ang = atan2(cpos.y, cpos.x);
    let lane = floor(ang * 38.0);
    let flow = fract(r * 1.6 - t * 1.8 * (0.6 + hash11(lane)));
    let streak = step(0.82, hash11(lane + 3.0)) * smoothstep(0.0, 0.25, flow) * smoothstep(0.55, 0.25, flow) * smoothstep(0.12, 0.45, r);
    col += mix(accent, vec3f(0.95, 0.93, 0.84), 0.5) * streak * speed * 0.45;
  }

  let v = uv - 0.5;
  col *= 1.0 - 0.9 * dot(v, v);
  let px = floor(uv / params.texel);
  col += (hash21(px + fract(t * 7.13) * vec2f(97.0, 41.0)) - 0.5) * params.grain;
  return vec4f(clamp(col, vec3f(0.0), vec3f(1.0)), 1.0);
}
