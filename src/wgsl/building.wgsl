// the building's vertex layer: the engine's mouse turn + shear, but the turn
// starts from facing the camera and aims at the pointer relative to where the
// building sits on screen.
//
// the engine's mouse.wgsl reads uScn.ms raw, which only works when the object
// is at the screen's centre. with the camera off to one side the building is
// somewhere else, so it was never facing you when you were on it.
//
//   aim = pointer - building's ndc position, then divided by the room that
//         side has, so the pointer at either screen edge is a full turn (+-1)
//         and sitting right on the building is no turn at all
//
//   ndc -1 ............ b ............ +1       b = where the building is
//        |<- room 1+b ->|<- room 1-b ->|
//
// uniforms are shear's: str, origin. entry points keep the engine's names
// (vsmh pos only, vsmht pos+uv) so .vx('vsmh') on the parent is unchanged
#i "../../engine/wgsl/shaders/mouse.wgsl"
#i "../../engine/wgsl/shaders/shear.wgsl"
#i "../../engine/wgsl/core/tex.wgsl"

// a building near the screen edge would divide by almost nothing
const MIN_ROOM : f32 = 0.2;

fn aim() -> vec2f {
  let c = proj(uObj.t - uScn.cm);
  let ndc = c.xy / c.w;
  let d = uScn.ms - ndc;
  let room = select(vec2f(1.0) + ndc, vec2f(1.0) - ndc, d >= vec2f(0.0));
  return clamp(d / max(room, vec2f(MIN_ROOM)), vec2f(-1.0), vec2f(1.0));
}

// the pose the mouse turn starts from: the building's front (+z) pointed at the
// camera, instead of wherever the model happens to face. the engine's matrices
// rotate by -angle, hence the signs
//
//   d = camera - building      yaw = atan2(d.x, d.z)      pitch = asin(d.y / |d|)
fn face_camera() -> mat3x3f {
  let d = uScn.cm - uObj.t;
  let yaw = atan2(d.x, d.z);
  let pitch = asin(d.y / length(d));
  return rotateY(-yaw) * rotateX(pitch);
}

// face the camera first, then let the pointer turn it, in screen axes
fn axf(_ap : vec3f) -> vec3f {
  let lp = xf(_ap) - uObj.t;
  return mouseRot(aim(), SWING) * (face_camera() * lp) + uObj.t;
}

@vertex
fn vsmh(@location(0) _ap : vec3f) -> vo {
  let w = shr(axf(_ap));
  var o : vo;
  o.p = proj(w - uScn.cm);
  o.w = w;
  return o;
}

@vertex
fn vsmht(@location(0) _ap : vec3f, @location(1) _uv : vec2f) -> vot {
  let w = shr(axf(_ap));
  var o : vot;
  o.p = proj(w - uScn.cm);
  o.w = w;
  o.uv = vec2f(_uv.x, 1.0 - _uv.y);
  return o;
}
