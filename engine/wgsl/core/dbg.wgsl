#i "transform.wgsl"

@fragment
fn fs(_i : vo) -> @location(0) vec4f {
  return vec4f(1.0, 0.0, 0.0, 0.35);
}
