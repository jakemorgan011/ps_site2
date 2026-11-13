// ps3d — the node blob, raymarched. port of legacy nodes_alpha0.frag.
//
// four points wander on a sphere, get joined by pinched capsules, smin'd into
// one surface, toon banded, dropped on a shadow catcher plane and outlined.
// alpha comes out straight (not premultiplied) so the thing composites over
// whatever is already in the attachment instead of over a backdrop.
//
// this is a fragment layer only. it adds no vertex entry of its own — it rides
// vst out of the transform layer, so the surface it draws on is an ordinary
// transformed object and the raymarch treats that object's uv as its screen.
// put it on a q and you get a window into the scene that moves with the quad.
//
// a parent drawing this wants what any uv carrying geometry wants:
//   vl() -> stride 20 (pos + uv)     gv() -> gu32()     ve() -> 'vst'
// and no group 2, since there's no texture to sample.
//
// uScn.tm is the only uniform it reads. the original divided by iResolution.y,
// which the engine's uniforms don't carry — uv moves by a fixed amount per
// pixel, so its own derivative is that number and no new uniform is needed.
#i "../core/transform.wgsl"

// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// distance field
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

fn sdCapsule(_p : vec3f, _a : vec3f, _b : vec3f, _r : f32) -> f32 {
  let pa = _p - _a;
  let ba = _b - _a;
  let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba*h) - _r;
}

// a capsule whose radius swells or pinches along its length. w peaks at the
// midpoint, so bulge < 0 waists the middle and the joins read as separate limbs.
// the lip divide keeps it a bound: the radius varies, so the raw distance
// overshoots by at most the slope of that variation.
fn sdProfiledCapsule(_p : vec3f, _a : vec3f, _b : vec3f, _r : f32,
                     _bulge : f32, _power : f32) -> f32 {
  let pa = _p - _a;
  let ba = _b - _a;
  let l2 = dot(ba, ba);
  let h = clamp(dot(pa, ba) / l2, 0.0, 1.0);
  let w = 4.0 * h * (1.0 - h);
  let s = 1.0 + _bulge * pow(w, _power);
  let d = length(pa - ba*h) - _r*s;
  let lip = 1.0 + abs(_bulge) * _power * _r / sqrt(l2);
  return d / lip;
}

fn sdRoundCone(_p : vec3f, _a : vec3f, _b : vec3f, _r1 : f32, _r2 : f32) -> f32 {
  let ba = _b - _a;
  let l2 = dot(ba, ba);
  let rr = _r1 - _r2;
  let a2 = l2 - rr*rr;
  let il2 = 1.0 / l2;
  let pa = _p - _a;
  let y = dot(pa, ba);
  let z = y - l2;
  let xp = pa*l2 - ba*y;
  let x2 = dot(xp, xp);
  let y2 = y*y*l2;
  let z2 = z*z*l2;
  let k = sign(rr)*rr*rr*x2;
  if (sign(z)*a2*z2 > k) { return sqrt(x2 + z2)*il2 - _r2; }
  if (sign(y)*a2*y2 < k) { return sqrt(x2 + y2)*il2 - _r1; }
  return (sqrt(x2*a2*il2) + y*rr)*il2 - _r1;
}

fn smin(_a : f32, _b : f32, _k : f32) -> f32 {
  let h = max(_k - abs(_a - _b), 0.0) / _k;
  return min(_a, _b) - h*h*_k*0.25;
}

fn hash21(_p : vec2f) -> f32 {
  var p = fract(_p * vec2f(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// a point on a sphere from a hashed seed, plus a slow wobble so it never sits
// still. theta comes through acos of a uniform variate, which is what keeps the
// distribution even instead of bunched at the poles.
fn nodePos(_seed : f32, _spread : f32, _t : f32) -> vec3f {
  let u = hash21(vec2f(_seed, 1.7));
  let v = hash21(vec2f(_seed, 9.1));
  let phi = v * 6.2831853;
  let theta = acos(1.0 - 2.0*u);
  let dir = vec3f(sin(theta)*cos(phi), cos(theta), sin(theta)*sin(phi));
  let wob = 0.22 * vec3f(sin(_t*1.25 + _seed),
                         cos(_t*1.05 + _seed*2.0),
                         sin(_t*0.85 + _seed*3.0));
  return _spread*dir + wob;
}

struct nds {
  a : vec3f,
  b : vec3f,
  c : vec3f,
  d : vec3f,
};

fn getNodes(_t : f32) -> nds {
  let spread = 0.85;
  var o : nds;
  o.a = nodePos(1.0, spread*0.3, _t);
  o.b = nodePos(2.0, spread, _t);
  o.c = nodePos(3.0, spread, _t);
  o.d = nodePos(4.0, spread, _t);
  return o;
}

fn map(p : vec3f) -> f32 {
  let r = 0.075;
  let soft = 0.10;

  let n = getNodes(uScn.tm);

  let A = sdProfiledCapsule(p, n.a, n.b, r, -0.5, 3.0);
  let B = sdProfiledCapsule(p, n.b, n.c, r, -0.5, 3.0);
  let C = sdProfiledCapsule(p, n.c, n.d, r, -0.5, 2.0);
  let D = sdProfiledCapsule(p, n.d, n.a, r, -0.1, 4.0);

  return smin(smin(smin(A, B, soft), smin(B, C, soft), soft),
              smin(smin(C, D, soft), smin(D, A, soft), soft), soft*2.0);
}

fn calcNormal(_p : vec3f) -> vec3f {
  let e = vec2f(1.0e-3, 0.0);
  return normalize(vec3f(
    map(_p + e.xyy) - map(_p - e.xyy),
    map(_p + e.yxy) - map(_p - e.yxy),
    map(_p + e.yyx) - map(_p - e.yyx)));
}

// x = hit distance or -1, y = the closest the ray ever came. the miss distance
// is what draws the outline in empty space, so it has to survive the miss.
fn raymarch(_ro : vec3f, _rd : vec3f) -> vec2f {
  var t = 0.0;
  var closest = 1.0e9;
  for (var i = 0; i < 160; i++) {
    let d = map(_ro + _rd*t);
    closest = min(closest, d);
    if (d < 0.0008) { return vec2f(t, 0.0); }
    if (t > 20.0) { break; }
    t += d * 0.85;
  }
  return vec2f(-1.0, closest);
}

fn softshadow(_ro : vec3f, _rd : vec3f, _mint : f32, _maxt : f32, _k : f32) -> f32 {
  var res = 1.0;
  var t = _mint;
  for (var i = 0; i < 56; i++) {
    let h = map(_ro + _rd*t);
    res = min(res, _k*h/t);
    if (res < 0.002 || t > _maxt) { break; }
    t += clamp(h, 0.015, 0.25);
  }
  return clamp(res, 0.0, 1.0);
}

// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
// shading
// ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

// four bands, edges softened by the screen space width of the intensity. the
// width is passed in rather than taken here: wgsl only allows derivatives in
// uniform control flow and this is called from inside a branch.
fn toonRampAA(_x : f32, _w : f32) -> vec3f {
  let w = max(_w, 1.0e-5); // a zero width smoothstep has low == high, undefined
  var c = vec3f(0.32, 0.32, 0.32);
  c = mix(c, vec3f(0.43, 0.43, 0.43), smoothstep(0.15 - w, 0.15 + w, _x));
  c = mix(c, vec3f(0.55, 0.55, 0.55), smoothstep(0.35 - w, 0.35 + w, _x));
  c = mix(c, vec3f(1.0, 1.0, 1.0),    smoothstep(0.45 - w, 0.45 + w, _x));
  return c;
}

const PLANE_Y       : f32 = -1.15;
const SHADOW_COL    : vec3f = vec3f(0.0, 0.0, 0.0);
const SHADOW_POWER  : f32 = 0.55;
const SHADOW_SOFT   : f32 = 7.0;
const SHADOW_SHRINK : f32 = 1.0;

// everything, camera included, lives in the node's own units: the blob spans
// about ±1.1, the march gives up at t = 20. scale the look with focal, never by
// scaling map(), or the camera, light and plane stop agreeing with the blob
const CAM_DIST : f32 = 3.8;
const CAM_HGT  : f32 = 1.1;

const AA          : i32 = 2;
const DEBUG_ALPHA : bool = false;
const PREMULT     : bool = false;

// src over dst, both sides straight alpha. the divide un-premultiplies the
// result so the value carried forward stays straight too.
fn over(_d : vec4f, _sc : vec3f, _sa : f32) -> vec4f {
  let na = _sa + _d.a * (1.0 - _sa);
  var c = _d.rgb;
  if (na > 1.0e-5) {
    c = (_sc*_sa + _d.rgb*_d.a*(1.0 - _sa)) / na;
  }
  return vec4f(c, na);
}

// _ipy = one pixel in uv units, ie 1.0 / iResolution.y
fn render(_uv : vec2f, _ipy : f32) -> vec4f {
  let n = getNodes(uScn.tm);
  let ta = (n.a + n.b + n.c + n.d) * 0.25;

  let ang = uScn.tm * 0.25;
  let ro = ta + vec3f(CAM_DIST*sin(ang), CAM_HGT, CAM_DIST*cos(ang));
  let fw = normalize(ta - ro);
  let rt = normalize(cross(vec3f(0.0, 1.0, 0.0), fw));
  let up = cross(fw, rt);
  let focal = 1.5;
  let rd = normalize(_uv.x*rt + _uv.y*up + focal*fw);

  let lightPos = ta + vec3f(2.2, 2.6, 1.8);
  let OUTLINE = vec3f(0.0, 0.0, 0.0);

  let res = raymarch(ro, rd);
  let t = res.x;

  // everything the surface shading needs, computed before the branch. wgsl
  // forbids derivatives under non-uniform control flow, and both the band width
  // and the depth edge below are derivatives of values only a hit produces.
  let ts = max(t, 0.0);
  let p = ro + rd*ts;
  let nrm = calcNormal(p);
  let toL = lightPos - p;
  let dist = length(toL);
  let l = toL / dist;
  let ndl = dot(nrm, l) * 0.5 + 0.5;
  let atten = 1.0 / (1.0 + 0.06*dist*dist);
  let intensity = ndl * atten * 2.4 * 0.575;
  let iw = fwidth(intensity) * 0.75;
  let dtx = dpdx(ts);
  let dty = dpdy(ts);

  var out = vec4f(0.0, 0.0, 0.0, 0.0);

  // shadow catcher plane, off for now
  // var tPlane = -1.0;
  // if (rd.y < -1.0e-4) {
  //   let tp = (PLANE_Y - ro.y) / rd.y;
  //   if (tp > 0.0 && tp < 40.0) { tPlane = tp; }
  // }

  let hitObj = t > 0.0;
  // let hitPlane = (tPlane > 0.0) && (!hitObj || tPlane < t);

  var refT = 4.0;
  if (hitObj) { refT = t; }
  let px = refT * 2.0 * _ipy / focal;
  let thickness = 4.5 * px;

  // if (hitPlane) {
  //   let pp = ro + rd*tPlane;
  //   let axis = vec3f(ta.x, PLANE_Y, ta.z);
  //   let sp = axis + (pp - axis) * SHADOW_SHRINK;
  //   let sh = softshadow(sp + vec3f(0.0, 0.02, 0.0), vec3f(0.0, 1.0, 0.0),
  //                       0.03, 6.0, SHADOW_SOFT);
  //   let fade = 1.0 - smoothstep(2.0, 7.0, length(sp.xz - ta.xz));
  //   out = over(out, SHADOW_COL, (1.0 - sh) * SHADOW_POWER * fade);
  // }

  if (hitObj) {
    var oc = toonRampAA(intensity, iw);
    let grazing = abs(dot(nrm, rd));
    let silh = smoothstep(0.14, 0.06, grazing);
    let depth = smoothstep(0.02, 0.08, length(vec2f(dtx, dty)) * grazing);
    oc = mix(oc, OUTLINE, max(silh, depth));
    out = over(out, oc, 1.0);
  } else {
    // never hit anything: band the near miss into a line, so the silhouette
    // keeps going where the surface stopped
    let band = 1.0 - smoothstep(thickness - px, thickness + px, res.y);
    out = over(out, OUTLINE, band);
  }

  return out;
}

@fragment
fn fs(_i : vot) -> @location(0) vec4f {
  // vst hands over uv in 0..1 with y already flipped for sampling. the raymarch
  // wants it centred and y up, which is the glsl's (fragCoord - 0.5*res)/res.y
  // over a square surface.
  let uv = vec2f(_i.uv.x - 0.5, 0.5 - _i.uv.y);
  let ipy = max(abs(dpdy(uv.y)), 1.0e-8);

  var acc = vec4f(0.0, 0.0, 0.0, 0.0);
  for (var j = 0; j < AA; j++) {
    for (var i = 0; i < AA; i++) {
      let o = (vec2f(f32(i), f32(j)) + 0.5) / f32(AA) - 0.5;
      let s = render(uv + o*ipy, ipy);
      acc += vec4f(s.rgb * s.a, s.a); // premultiply to average, straighten after
    }
  }
  acc /= f32(AA*AA);

  let a = acc.a;
  var c = vec3f(0.0, 0.0, 0.0);
  if (a > 1.0e-5) { c = acc.rgb / a; }

  if (DEBUG_ALPHA) { return vec4f(a, a, a, 1.0); }
  if (PREMULT) { return vec4f(c*a, a); }
  return vec4f(c, a);
}
