// hangout's platforms: the crop island under the viewport, the hangout_test platform
// (+ ps_site2's face cube) under the info card. textured, then the four toon bands on
// top: the greys darken the texture, the last band tints it red. lit per face like
// ball.wgsl, from above and the side the camera swings out to (-x, +z). the fence png
// has see-through gaps, those texels are cut out
#i "../../engine/wgsl/core/transform.wgsl"

@group(2) @binding(0) var uSm : sampler;
@group(2) @binding(1) var uKd : texture_2d<f32>;

const LIGHT_DIR : vec3f = vec3f(-0.6, 1.0, 0.5);
const SHADOW_TINT : vec3f = vec3f(0.95, 0.2, 0.3);
const ALPHA_CUT : f32 = 0.5;

fn band(_it : f32) -> vec3f {
  if (_it > 0.75) { return vec3f(0.96); }
  if (_it > 0.45) { return vec3f(0.87); }
  if (_it > 0.15) { return vec3f(0.61); }
  return SHADOW_TINT * 0.61;
}

@fragment
fn fs(_i : vot) -> @location(0) vec4f {
  let n = faceNormal(_i.w);
  let it = max(dot(n, normalize(LIGHT_DIR)), 0.0);
  let c = textureSample(uKd, uSm, _i.uv);
  if (c.a < ALPHA_CUT) {
    discard;
  }
  return vec4f(c.rgb * band(it), 1.0);
}
