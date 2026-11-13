precision highp float;

varying float vLightIntensity;

void main() {
  float intensity = vLightIntensity * 0.5;
  vec4 color;
  
  if (intensity > 0.45) {
    color = vec4(0.96, 0.96, 0.96, 1.0);
  } else if (intensity > 0.2) {
    color = vec4(0.87, 0.87, 0.87, 1.0);
  } else if (intensity > 0.15) {
    color = vec4(0.61, 0.61, 0.61, 1.0);
  } else {
    color = vec4(0.95, 0.2, 0.3, 1.0);
  }

  gl_FragColor = color;
}
