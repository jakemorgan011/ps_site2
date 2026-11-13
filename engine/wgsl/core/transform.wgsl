#i "scn.wgsl"

struct obj {
  t  : vec3f,    
  sc : f32,      
  rt : vec3f,    
  fc : f32,      
  lo : vec3f,    
  lk : f32,      // 1 = screen locked, drawn as if the camera had no yaw. fw() quads
};

@group(0) @binding(0) var<uniform> uScn : scn;
@group(1) @binding(0) var<uniform> uObj : obj;

struct vo {
  @builtin(position) p : vec4f,
  @location(0) w : vec3f,   
};

struct vot {
  @builtin(position) p : vec4f,
  @location(0) w : vec3f,
  @location(1) uv : vec2f,
};

const nr : f32 = 0.1;
const fr : f32 = 100.0;

fn rotateX(_a : f32) -> mat3x3f {
  let c = cos(_a);
  let s = sin(_a);
  return mat3x3f(1.0, 0.0, 0.0,
                 0.0, c, -s,
                 0.0, s, c);
}

fn rotateY(_a : f32) -> mat3x3f {
  let c = cos(_a);
  let s = sin(_a);
  return mat3x3f(c, 0.0, s,
                 0.0, 1.0, 0.0,
                 -s, 0.0, c);
}

fn rotateZ(_a : f32) -> mat3x3f {
  let c = cos(_a);
  let s = sin(_a);
  return mat3x3f(c, -s, 0.0,
                 s, c, 0.0,
                 0.0, 0.0, 1.0);
}

fn faceCamera(_p : vec3f, _cm : vec3f, _t : vec3f) -> vec3f {
  let fw = normalize(_cm - _t);
  var up = vec3f(0.0, 1.0, 0.0);
  if (abs(dot(fw, up)) > 0.999) {
    up = vec3f(0.0, 0.0, 1.0);
  }
  let rg = normalize(cross(up, fw));
  return mat3x3f(rg, cross(fw, rg), fw) * _p;
}

// world offset from the camera -> camera space: turned by the yaw, then the pitch
//   yaw    x' = x cos(yw) - z sin(yw)     z' = x sin(yw) + z cos(yw)
//   pitch  y" = y cos(pt) - z' sin(pt)    z" = y sin(pt) + z' cos(pt)
fn view(_vp : vec3f) -> vec3f {
  if (uObj.lk > 0.5) {
    return _vp;
  }
  let cy = cos(uScn.yw);
  let sy = sin(uScn.yw);
  let cp = cos(uScn.pt);
  let sp = sin(uScn.pt);
  let x = _vp.x * cy - _vp.z * sy;
  let z = _vp.x * sy + _vp.z * cy;
  return vec3f(x, _vp.y * cp - z * sp, _vp.y * sp + z * cp);
}

fn proj(_wp : vec3f) -> vec4f {
  let _vp = view(_wp);
  let f = 1.0 / tan(uScn.fov * 0.5);
  return vec4f(_vp.x * f / uScn.asp,
               _vp.y * f,
               _vp.z * fr / (nr - fr) + nr * fr / (nr - fr),
               -_vp.z);
}

fn faceNormal(_w : vec3f) -> vec3f {
  let n = normalize(cross(dpdx(_w), dpdy(_w)));
  return select(-n, n, dot(n, normalize(uScn.cm - _w)) >= 0.0);
}

fn xf(_ap : vec3f) -> vec3f {
  let sp = (_ap + uObj.lo) * uObj.sc;
  var p = rotateZ(uObj.rt.z) * rotateY(uObj.rt.y) * rotateX(uObj.rt.x) * sp;
  if (uObj.fc > 0.5) {
    p = faceCamera(p, uScn.cm, uObj.t);
  }
  return p + uObj.t;
}

@vertex
fn vs(@location(0) _ap : vec3f) -> vo {
  let w = xf(_ap);
  var ot : vo;
  ot.p = proj(w - uScn.cm);
  ot.w = w;
  return ot;
}

@vertex
fn vst(@location(0) _ap : vec3f, @location(1) _uv : vec2f) -> vot {
  let w = xf(_ap);
  var ot : vot;
  ot.p = proj(w - uScn.cm);
  ot.w = w;
  ot.uv = vec2f(_uv.x, 1.0 - _uv.y);
  return ot;
}
