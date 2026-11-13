// mouse + shear, a vertex layer. a parent only draws through one vertex entry,
// so this is the pair of them in one: turned toward the pointer (mouse.wgsl),
// then leaned (shear.wgsl). the lean comes second so it stays in world axes
// however far the turn goes. .vx('vsmh') on the parent: vsmh pos only, vsmht
// pos+uv. uniforms are shear's: str, origin
#i "mouse.wgsl"
#i "shear.wgsl"

@vertex
fn vsmh(@location(0) _ap : vec3f) -> vo {
  let w = shr(mxf(_ap));
  var o : vo;
  o.p = proj(w - uScn.cm);
  o.w = w;
  return o;
}

@vertex
fn vsmht(@location(0) _ap : vec3f, @location(1) _uv : vec2f) -> vot {
  let w = shr(mxf(_ap));
  var o : vot;
  o.p = proj(w - uScn.cm);
  o.w = w;
  o.uv = vec2f(_uv.x, 1.0 - _uv.y);
  return o;
}
