// vectors with named fields, for group 3 uniforms. su() writes a struct field
// by field off the object it's handed, so su('str', {x: 2, y: 0}) and
// su('rgb', {r: 1, g: 0, b: 0}) land as written, a field left out keeps its
// last value, and su('str.x', 2) sets one. a plain vec2f zeroes on {x, y}:
// it only takes [2, 0] or a v
struct nxy {
  x : f32,
  y : f32,
};

struct nxyz {
  x : f32,
  y : f32,
  z : f32,
};

struct nrgb {
  r : f32,
  g : f32,
  b : f32,
};
