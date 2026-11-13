#i "../core/transform.wgsl"

const SWING : f32 = 0.3471976; // 60 degrees

fn mouseRot(_m : vec2f, _k : f32) -> mat3x3f {
  return rotateY(-_m.x * _k) * rotateX(_m.y * _k);
}

fn mxf(_ap : vec3f) -> vec3f {
  let lp = xf(_ap) - uObj.t;
  return mouseRot(uScn.ms, SWING) * lp + uObj.t;
}

@vertex
fn vsm(@location(0) _ap : vec3f) -> vo {
  let w = mxf(_ap);
  var o : vo;
  o.p = proj(w - uScn.cm);
  o.w = w;
  return o;
}

@vertex
fn vsmt(@location(0) _ap : vec3f, @location(1) _uv : vec2f) -> vot {
  let w = mxf(_ap);
  var o : vot;
  o.p = proj(w - uScn.cm);
  o.w = w;
  o.uv = vec2f(_uv.x, 1.0 - _uv.y);
  return o;
}
