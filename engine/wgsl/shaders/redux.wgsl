#i "../core/filter.wgsl"

struct prm {
  px : f32,
  ps : f32,
};
@group(3) @binding(0) var<uniform> uP : prm;

@fragment
fn fs(_i: vo) -> @location(0) vec4f {
  let res = vec2f(textureDimensions(uTx));
  let px = max(uP.px, 1.0);
  let uv = floor(_i.uv * res / px) * px / res;
  var c = textureSampleLevel(uTx, uSm, uv, 0.0);
  // an srgb texture samples as linear, so step it back to gamma first or the darks all floor to 0
  if (uP.ps > 0.0) {
    let g = pow(c.rgb, vec3f(1.0 / 2.2));
    c = vec4f(pow(floor(g * uP.ps) / uP.ps, vec3f(2.2)), c.a);
  }
  return c;
}
