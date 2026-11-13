#i "transform.wgsl"

@group(2) @binding(0) var uSm : sampler;
@group(2) @binding(1) var uKd : texture_2d<f32>;

@fragment
fn fs(_i : vot) -> @location(0) vec4f {
  return textureSample(uKd, uSm, _i.uv); // alpha passes through. only a blended parent reads it
}
