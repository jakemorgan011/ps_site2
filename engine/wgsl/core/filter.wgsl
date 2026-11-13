#i "scn.wgsl"

struct vo {
  @builtin(position) p : vec4f,
  @location(0) uv : vec2f,
};

@group(0) @binding(0) var uSm : sampler;
@group(0) @binding(1) var uTx : texture_2d<f32>;
@group(1) @binding(0) var<uniform> uScn : scn;

@vertex
fn vs(@builtin(vertex_index) _i : u32) -> vo {
  let x = f32(i32(_i & 1u) * 4 - 1);   // -1, 3, -1
  let y = f32(i32(_i >> 1u) * 4 - 1);  // -1, -1, 3
  var o : vo;
  o.p = vec4f(x, y, 0.0, 1.0);
  o.uv = vec2f(x, -y) * 0.5 + 0.5;
  _ = uScn.tm; // layout:'auto' only keeps bindings something reads. pin the scene block so rf can always bind group 1
  return o;
}
