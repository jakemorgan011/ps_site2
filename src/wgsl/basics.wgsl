const PI: f32 = 3.14159265;
const A1: f32 = 40.10245;
const B1: f32 = 3.3052;
const A2: f32 = 523.76430;
const B2: f32 = 0.0000521;

const RING_WIDTH: f32 = 0.02;

//  one spoke, then the fold repeats it
//
//        ring (size), centered at `pos`
//            ___
//          /  |  \      smin(line, ring, soft) webs the
//         |   |   |     crossings into teardrop fillets
//          \__|__/
//             |
//             |  line: capsule from origin out to `len`
//             o  origin

struct spoke_params {
  pos       : f32,
  size      : f32,
  soft      : f32,
  len       : f32,
  thickness : f32,
};

struct spoke_cell {
  p : vec2f,
  i : i32,
};

fn smin(a: f32, b: f32, k: f32) -> f32{
  let h: f32 = max(k-abs(a-b), 0.0)/k;
  return min(a,b) - h*h*k*0.25;
}

fn smax(a: f32, b: f32, k: f32) -> f32{
  return -smin(-a, -b, k);
}

// rotates by -r: positive r goes clockwise
fn rot(p: vec2f, r: f32) -> vec2f {
  let c = cos(r);
  let s = sin(r);
  let m = mat2x2f(c, s, -s, c);
  let p2 = p * m;
  return p2;
}

fn sdTorus(p: vec2f, R: f32, r: f32) -> f32 {
  let q: vec2f = vec2f(length(p.xy) - R, 0.0);
  return length(q) - r;
}

fn sdLine(p: vec2f, r: f32, len: f32) -> f32 {
  let q = vec2f(p.x, p.y - clamp(p.y, 0.0, len));
  return length(q) - r;
}

fn h_shear(uvin: vec2f, k: f32){
}

// the whole arc of spokes travels around the full ring as a group. every spoke
// follows the same path, each one `lag` seconds behind the spoke ahead of it, so
// the offsets between them grow linearly down the arc and it trails like a tail
struct orbit_params {
  speed : f32,  // peak angular speed, radians per second. negative reverses
  swoop : f32,  // how fast the speed swells and fades, radians per second
  lag   : f32,  // seconds each spoke trails the one ahead
};

//   angle(tau) = speed / 2 * (tau - sin(swoop * tau) / swoop)
//
//   its speed is speed / 2 * (1 - cos(swoop * tau)): zero at tau = 0, so the
//   start is slow, then it swells to `speed`, fades, and swells again, always
//   forward. speed = 2 * swoop makes exactly one lap per swell
//
//   tau is the spoke's own clock: t minus its lag, held at 0 until its turn, so
//   the spokes don't all start at once
fn orbit_angle(j: i32, n: i32, t: f32, ob: orbit_params) -> f32 {
  let w = max(ob.swoop, 0.001);
  // how many spokes are ahead of this one. the front of the motion starts first
  let ahead = select(n - 1 - j, j, ob.speed < 0.0);
  let tau = max(t - f32(ahead) * ob.lag, 0.0);
  return 0.5 * ob.speed * (tau - sin(w * tau) / w);
}

// `orbit` is added to the spoke's rest angle, ccw
fn spoke_cell_at(p: vec2f, j: i32, n: i32, arc: f32, orbit: f32) -> spoke_cell {
  let half = f32(n - 1) * 0.5;
  var cell: spoke_cell;
  cell.p = rot(p, (f32(j) - half) * arc / f32(n) + orbit);
  cell.i = j;
  return cell;
}

fn find_spoke(p: vec2f, n: i32, arc: f32) -> spoke_cell {
  let spacing = arc / f32(n);
  let half = f32(n - 1) * 0.5;
  let angle = atan2(-p.x, p.y);
  let j = i32(clamp(round(angle / spacing + half), 0.0, f32(n - 1)));
  return spoke_cell_at(p, j, n, arc, 0.0);
}

fn spoke(p: vec2f, sp: spoke_params, fluid: f32) -> f32 {
  let line = sdLine(p, sp.thickness, sp.len);
  let ring = sdTorus(p - vec2f(0.0, sp.pos), sp.size, RING_WIDTH);
  return smin(line, ring, sp.soft * fluid);
}

// even spoke index uses `even`, odd uses `odd`. t is seconds, ob is how the arc
// travels the ring.
// every spoke is drawn at every pixel, not just the nearest wedge's: the spokes
// leave their wedges as they orbit, so the wedge fold (find_spoke) can't say
// which one is near a pixel any more. it's a union over n spokes, n is small
fn star(p: vec2f, n: i32, arc: f32, fluid: f32, even: spoke_params, odd: spoke_params,
        t: f32, ob: orbit_params) -> f32 {
  var d = 1e10;
  for (var j = 0; j < n; j++) {
    let cell = spoke_cell_at(p, j, n, arc, orbit_angle(j, n, t, ob));
    var sp = even;
    if ((cell.i % 2) != 0) {
      sp = odd;
    }
    d = min(d, spoke(cell.p, sp, fluid));
  }
  return d;
}

// outer and inner are (radius, thickness), hard-unioned
fn dial(p: vec2f, outer: vec2f, inner: vec2f) -> f32 {
  return min(sdTorus(p, outer.x, outer.y), sdTorus(p, inner.x, inner.y));
}

// smax lifts the field wherever the two inputs are within k, so k is how
// far the carve reaches past the hole. keep it small
fn carve_hole(d: f32, p: vec2f, r: f32, k: f32) -> f32 {
  return smax(d, -(length(p) - r), k);
}

fn pinch(p: vec2f) -> vec2f {
  return vec2f(p.x, p.y * smax(abs(p.x) * 2.0, 1.0, 0.4));
}

fn sdFillSquare(p: vec2f, size: f32, soft: f32, scale_height: f32, scale_width: f32) -> f32 {
  let q: vec2f = abs(vec2f(p.x*scale_height, p.y* scale_width)) - vec2f(size);
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - soft;
}

fn sdCircle(p: vec2f, R: f32) -> f32{
  let q: vec2f = vec2f(length(p.xy) - R, 0.0);
  return length(q);
}
