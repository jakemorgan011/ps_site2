#i "../../engine/wgsl/core/transform.wgsl"

@group(2) @binding(0) var uSm : sampler;
@group(2) @binding(1) var uKd : texture_2d<f32>;

// px: redux block size. hv: 0 at rest, 1 hovered, eased in between
struct prm {
  px : f32,
  hv : f32,
};
@group(3) @binding(0) var<uniform> uP : prm;

// border width in target pixels (scene_t is 2x on retina, so 4 reads as 2)
const OUTLINE_PX : f32 = 4.0;
// grey matches the spokes' fill
const OUTLINE_REST : vec3f = vec3f(0.28, 0.28, 0.28);
const OUTLINE_HOVER : vec3f = vec3f(1.0, 0.85, 0.1);

// xf() run backwards: world -> the quad's own -1..1 square. the uv can't be used
// for this, a 'cv' fit has already cropped it
fn toLocal(_w : vec3f) -> vec2f {
  let r = rotateZ(uObj.rt.z) * rotateY(uObj.rt.y) * rotateX(uObj.rt.x);
  return ((transpose(r) * (_w - uObj.t)) / uObj.sc - uObj.lo).xy;
}

// pixels from the fragment in to the nearest edge, per axis, then the closer one
//
//   +-----------+  <- |l| = 1
//   |###########|
//   |#  image  #|   # = within OUTLINE_PX of the edge
//   |###########|
//   +-----------+
fn edgePx(_l : vec2f) -> f32 {
  let gx = length(vec2f(dpdx(_l.x), dpdy(_l.x)));
  let gy = length(vec2f(dpdx(_l.y), dpdy(_l.y)));
  let e = (1.0 - abs(_l)) / max(vec2f(gx, gy), vec2f(1e-6));
  return min(e.x, e.y);
}

// redux without its own target: snap the fragment to the centre of its px cell on
// the screen grid, then walk the uv over to that centre along its screen derivatives.
// same blocks the redux filter makes, on a quad that sits anywhere in the scene
//
//   +-------+-------+     p    = this fragment
//   |   p   |       |     cell = centre of its px block
//   |  cell |       |     uv  += dpdx(uv) * dx + dpdy(uv) * dy
//   +-------+-------+
//
// the outline is not snapped, it stays a clean line around the blocks
@fragment
fn fs(_i : vot) -> @location(0) vec4f {
  let px = max(uP.px, 1.0);
  let d = (floor(_i.p.xy / px) + 0.5) * px - _i.p.xy;
  let uv = _i.uv + dpdx(_i.uv) * d.x + dpdy(_i.uv) * d.y;
  let c = textureSampleLevel(uKd, uSm, uv, 0.0);
  let k = clamp(OUTLINE_PX - edgePx(toLocal(_i.w)) + 0.5, 0.0, 1.0);
  let ol = mix(OUTLINE_REST, OUTLINE_HOVER, clamp(uP.hv, 0.0, 1.0));
  return vec4f(mix(c.rgb, ol, k), max(c.a, k));
}
