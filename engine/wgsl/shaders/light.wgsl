// light, a filter. a point light over a picture, in the picture's own space:
// it never sees the world, only the texels it's handed, and it lights what's
// there. empty (alpha 0) stays empty, black stays black.
//
// lightpos   x, y where it sits over the picture, -1..1 with y up (0,0 is the
//            centre, same space as the pointer). z how far off the surface it
//            hangs = how wide the pool is. z 0 = 0.5
// rgb        its colour, 0..1 a channel. unset = white
// intensity  how bright the middle of the pool gets. 0 = off, the picture
//            passes through untouched. below 0 it takes light away
//
//           o  light
//          /|\
//         / | \  z
//   _____/__|__\_____  picture
//           ^ lightpos.xy
//
//   pool = (1 + d²/z²)^-1.5, inverse square times the angle it lands at,
//   scaled so the centre is exactly intensity
//
// a lit channel past 1 scales the whole colour down instead of clipping, so
// a red light on white reads red instead of vanishing into it
#i "../core/filter.wgsl"
#i "../core/nv.wgsl"

@group(3) @binding(0) var<uniform> lightpos : nxyz;
@group(3) @binding(1) var<uniform> rgb : nrgb;
@group(3) @binding(2) var<uniform> intensity : f32;

const HGT : f32 = 0.5;

fn pool(_d : vec2f, _h : f32) -> f32 {
  return pow(1.0 + dot(_d, _d) / (_h * _h), -1.5);
}

@fragment
fn fs(_i : vo) -> @location(0) vec4f {
  let c = textureSampleLevel(uTx, uSm, _i.uv, 0.0);
  let res = vec2f(textureDimensions(uTx));
  let asp = res.x / res.y;
  let p = vec2f((_i.uv.x * 2.0 - 1.0) * asp, 1.0 - _i.uv.y * 2.0);
  let lp = vec2f(lightpos.x * asp, lightpos.y);
  let h = select(abs(lightpos.z), HGT, lightpos.z == 0.0);
  var lc = vec3f(rgb.r, rgb.g, rgb.b);
  if (all(lc == vec3f(0.0))) {
    lc = vec3f(1.0);
  }
  let lit = max(c.rgb * (1.0 + lc * intensity * pool(p - lp, h)), vec3f(0.0));
  return vec4f(lit / max(max(lit.r, lit.g), max(lit.b, 1.0)), c.a);
}
