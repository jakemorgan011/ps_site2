precision highp float;

attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uLightPosition;

varying float vLightIntensity;

// so i think technically i need to create a matrix to *twist* the vertex positions.

// i made deepseek clean my code cause i hate my stupid chud life.
void main() {
  // Transform position
  vec4 viewPosition = uModelViewMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * viewPosition;
  
  mat3 normalMatrix = mat3(uModelViewMatrix);
  vec3 normal = normalize(normalMatrix * aNormal);

  // Calculate lighting (simplified for p5.js)
  vec3 lightDir = normalize(uLightPosition - viewPosition.xyz);
  vLightIntensity = max(dot(normal, lightDir), 0.0);
}
