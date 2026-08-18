#version 300 es

precision highp float;

in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uTranslation;
uniform vec3 uRotation;
uniform vec3 uCameraPosition;
uniform bool uFaceCamera;

mat3 rotateX(float a){
  float c = cos(a), s = sin(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
}
mat3 rotateY(float a){
  float c = cos(a), s = sin(a);
  return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
}
mat3 rotateZ(float a){
  float c = cos(a), s = sin(a);
  return mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
}

void main(){
  mat3 rot = rotateZ(uRotation.z) * rotateY(uRotation.y) * rotateX(uRotation.x);
  vec3 rotated = rot * aPosition;
  vec4 viewPosition = uModelViewMatrix * vec4(rotated + uTranslation, 1.0);
  gl_Position = uProjectionMatrix * viewPosition;
}
