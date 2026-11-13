// shear, a vertex layer. no fs on purpose: pair it with any fragment file
// (tex_shear.wgsl is the textured one) and put .vx('vsh') on the parent,
// which draws vsh (pos only) or vsht (pos+uv) depending on its layout.
//
// str     x: how far x slides per unit up, y: how far y slides per unit across.
//         {x: 2, y: 0} leans everything right, 2 over for every 1 up
// origin  the point nothing moves around, world units off the object's centre.
//         the x shear keeps the row through it, the y shear the column
//
//   str {x: 1, y: 0}, origin {x: 0, y: -1}
//
//        +------+                 +------+
//        |      |                /      /
//        |  c   |      ->       /  c   /
//        |      |              /      /
//   -----+------+-----   -----+------+-----   origin row, planted
//
// both unset = 0,0, so it does nothing until str is set. world axes, after the
// object's own transform: it leans the same way however the object is spun.
// group 3 bindings 8 up so it never collides with a fragment file's (toon's
// lightpos is 0)
#i "../core/transform.wgsl"
#i "../core/nv.wgsl"

@group(3) @binding(8) var<uniform> str : nxy;
@group(3) @binding(9) var<uniform> origin : nxy;

fn shr(_w : vec3f) -> vec3f {
  let d = _w.xy - uObj.t.xy - vec2f(origin.x, origin.y);
  return vec3f(_w.x + str.x * d.y, _w.y + str.y * d.x, _w.z);
}

@vertex
fn vsh(@location(0) _ap : vec3f) -> vo {
  let w = shr(xf(_ap));
  var o : vo;
  o.p = proj(w - uScn.cm);
  o.w = w;
  return o;
}

@vertex
fn vsht(@location(0) _ap : vec3f, @location(1) _uv : vec2f) -> vot {
  let w = shr(xf(_ap));
  var o : vot;
  o.p = proj(w - uScn.cm);
  o.w = w;
  o.uv = vec2f(_uv.x, 1.0 - _uv.y);
  return o;
}
