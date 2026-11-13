struct scn {
  cm  : vec3f,   // camera position, world space
  asp : f32,     // width / height
  fov : f32,     // vertical field of view, radians
  tm  : f32,     // seconds since boot
  ms  : vec2f,   // pointer over the canvas, -1..1, y up. was the block's padding
  yw  : f32,     // camera yaw about y, radians. 0 looks down -z, pi looks down +z
  pt  : f32,     // camera pitch, radians, after the yaw. positive looks down
};
