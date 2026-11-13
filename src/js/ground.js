// keeps a rotating, not quite round ball touching something sitting on top of it.
// the ball's radius runs about 1.26 to 1.34, so scaled up its surface under the
// building rises and falls by a couple of units as it turns. a fixed radius can't
// be right at every angle, so measure the surface instead

// column-major 3x3, laid out like the mat3x3f constructors in transform.wgsl,
// which rotate by -angle
function rot_x(a){
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [1, 0, 0, 0, c, -s, 0, s, c];
}

function rot_y(a){
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}

function rot_z(a){
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

function mul(a, b){
  const out = new Array(9);
  for(let col = 0; col < 3; col++){
    for(let row = 0; row < 3; row++){
      let sum = 0;
      for(let k = 0; k < 3; k++) sum += a[k * 3 + row] * b[col * 3 + k];
      out[col * 3 + row] = sum;
    }
  }
  return out;
}

// the engine applies z * y * x, see xf() in transform.wgsl
export function euler(rt){
  return mul(rot_z(rt.z), mul(rot_y(rt.y), rot_x(rt.x)));
}

// the mesh's points with the object's pivot applied, flat xyz, unscaled
export function pivoted(points, lo){
  const out = new Float32Array(points.length * 3);
  points.forEach((p, i) => {
    out[i * 3] = p.x + lo.x;
    out[i * 3 + 1] = p.y + lo.y;
    out[i * 3 + 2] = p.z + lo.z;
  });
  return out;
}

// the highest the ball's surface gets, in world units above its centre, among the
// points within `foot` of straight above it. m is euler(rt), scale the ball's
export function surface_top(points, m, scale, foot){
  const reach = (foot / scale) ** 2;
  let top = -Infinity;
  for(let i = 0; i < points.length; i += 3){
    const x = points[i];
    const y = points[i + 1];
    const z = points[i + 2];
    const wx = m[0] * x + m[3] * y + m[6] * z;
    const wz = m[2] * x + m[5] * y + m[8] * z;
    if(wx * wx + wz * wz > reach) continue;
    top = Math.max(top, m[1] * x + m[4] * y + m[7] * z);
  }
  return top * scale;
}
