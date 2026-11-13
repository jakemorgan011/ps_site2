// hangout's test_ball toon shader. four bands off the surface normal.
// the original lit it per vertex from a light at (0, 3, 4); this lights per
// face, which is what the engine's normals are, and the ball is dense enough
// that the facets don't read.
//
// the shadow is faked: no light ray, no shadow map. an ellipse on the ground
// plane that knocks the light intensity down, so the toon bands drop to the
// red one inside it
//
//   shadow.xy   ellipse center, world x and z
//   shadow.zw   ellipse radii along x and z
//
//        building
//        +------+
//        |      |
//   -----+------+------  ball surface, seen from above
//            (  ###  )   <- ellipse, pushed off to one side of the footprint
#i "../../engine/wgsl/core/transform.wgsl"

@group(3) @binding(0) var<uniform> shadow : vec4f;

const LIGHT_POS : vec3f = vec3f(0.0, 1.0, 5.0);
// how much intensity the shadow takes away. 0.3 turns the white band green
// and everything darker into the red one
const SHADOW_DROP : f32 = 0.3;

@fragment
fn fs(_i : vo) -> @location(0) vec4f {
  let n = faceNormal(_i.w);
  let l = normalize(LIGHT_POS - _i.w);

  let e = (_i.w.xz - shadow.xy) / shadow.zw;
  let in_shadow = 1.0 - step(1.0, dot(e, e));

  let it = max(dot(n, l), 0.0) * 0.5 - in_shadow * SHADOW_DROP;

  if (it > 0.45) { return vec4f(0.96, 0.96, 0.96, 1.0); }
  if (it > 0.2)  { return vec4f(0.97, 0.97, 0.97, 1.0); }
  if (it > 0.15) { return vec4f(0.91, 0.91, 0.91, 1.0); }
  return vec4f(0.7, 0.7, 0.75, 1.0);
}
