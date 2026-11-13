#i "../../engine/wgsl/core/transform.wgsl"
#i "basics.wgsl"

const NUM_SPOKES: i32 = 6;
// angle the spokes' wedges tile. 2*PI = full ring
const SPOKE_ARC: f32 = PI / 1.0;
// where the arc begins, ccw from +y (0 = up, PI/2 = left). the arc sweeps
// ccw from here
const SPOKE_START: f32 = -SPOKE_ARC * 1.7;
const SPOKE_MID: f32 = SPOKE_START + SPOKE_ARC * 0.5;
const FORM_SCALE: f32 = 0.9;
// radians per second, 0 = still
const SCENE_SPIN: f32 = 0.0;

// what the quad's uv -1..1 spans in form space. 3.46 is the half-height a
// fullscreen fit gives at the camera's distance, so the framing matches
// the standalone spokes scene
const QUAD_RANGE: f32 = 3.46;

const OBJ_COLOR: vec4f = vec4f(0.28, 0.28, 0.28, 0.8);
// this draws over another scene, so outside the shape is see-through.
// rgb matches OBJ_COLOR so the anti-aliased edge doesn't pick up a tint
const BG_COLOR: vec4f = vec4f(OBJ_COLOR.rgb, 0.0);

const DIAL_R: f32 = 1.55;
const OUTER_RING: vec2f = vec2f(DIAL_R, RING_WIDTH);
const INNER_RING: vec2f = vec2f(0.75, RING_WIDTH);

// how far a spoke's line pokes past the outer dial ring
const LINE_CARDINAL: f32 = 1.2;
const LINE_DIAGONAL: f32 = 1.2;
const PUSH_CARDINAL: f32 = 0.5;
const PUSH_DIAGONAL: f32 = 0.5;

const INNER_RING_R: f32 = 0.1;
const SOFT: f32 = 0.15;

// the arc of spokes travels the full ring as a group: peak radians per second,
// how fast that speed swells and fades (speed = 2 * swoop is one lap per swell,
// about 7 s here, slowest where it started), and seconds each spoke trails the
// one ahead of it. all constants, nothing driven from js
const ORBIT: orbit_params = orbit_params(1.8, 0.9, 0.18);

// mouse position over the canvas, -1..1, y up
@group(3) @binding(0) var<uniform> uMouse : vec2f;

// eye ring sits tangent to the dial, pushed outward by `push`
fn scene_spoke(line: f32, push: f32) -> spoke_params {
  var sp = spoke_params(0.0, 0.64, 0.77, 0.0, 0.011);
  sp.pos = DIAL_R - sp.size + push;
  sp.len = DIAL_R + line;
  return sp;
}

// even spoke index = cardinal, odd = diagonal
fn form(p: vec2f, fluid: f32) -> f32 {
  let cardinal = scene_spoke(LINE_CARDINAL, PUSH_CARDINAL);
  let diagonal = scene_spoke(LINE_DIAGONAL, PUSH_DIAGONAL);
  let rings = dial(p, OUTER_RING, INNER_RING);
  let spokes = star(rot(p, SPOKE_MID), NUM_SPOKES, SPOKE_ARC, fluid, cardinal, diagonal, uScn.tm, ORBIT);
  let body = smin(rings, spokes, 0.3 * fluid);
  return carve_hole(body, p, INNER_RING_R, SOFT);
}

// the form lives in the quad's own uv, not world xy, so tilting the quad
// tilts the picture with it. uv.y runs down, form space runs up
@fragment
fn fs(_i : vot) -> @location(0) vec4f {
  let pos = vec2f(_i.uv.x * 2.0 - 1.0, 1.0 - _i.uv.y * 2.0) * QUAD_RANGE;
  let p = rot(pos * FORM_SCALE, uScn.tm * SCENE_SPIN);
  let p2 = vec2f(pos.x - 1.0, pos.y - 0.9);
  let f = sdFillSquare(p2, 0.8, 0.1, 0.9*(-1*uMouse.x*0.5 + 1.0), 2.8*(-1*uMouse.y*0.5 + 1.0));
  let fluid = mix(0.1, 1.2, uMouse.x * 0.5 + 0.5);
  let d = form(p, fluid);
  let body = smin(d, f, SOFT);
  let aa = fwidth(body);
  let ink = smoothstep(-aa, aa, body);
  return mix(OBJ_COLOR, BG_COLOR, ink);
}
