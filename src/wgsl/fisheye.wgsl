#i "../../engine/wgsl/core/filter.wgsl"

@group(3) @binding(0) var<uniform> strength : f32;

@fragment
fn fs(_i : vo) -> @location(0) vec4f {
  let k = max(strength, 0.001);
  let uv = _i.uv * 2.0 - 1.0;
  let dist = length(uv);
  var warped = uv;
  if (dist > 0.0) {
    warped = (uv / dist) * (atan(dist * k) / atan(k));
  }
  let st = warped * 0.5 + 0.5;
  if (st.x < 0.0 || st.x > 1.0 || st.y < 0.0 || st.y > 1.0) {
    return vec4f(0.0, 0.0, 0.0, 1.0);
  }
  return textureSampleLevel(uTx, uSm, st, 0.0);
}
