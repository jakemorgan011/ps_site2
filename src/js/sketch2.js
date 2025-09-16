// dimensionality page

let sketch_dimensionality = function(p){
  let obj;
  let c = p.color(255,255,255,0);
  let toon_shader;
  let l_pos = [20,-2,0.2];
  p.setup = function(){
    p.createCanvas(600,600,p.WEBGL);
    p.angleMode(p.DEGREES);
    p.noStroke();
  };
  p.preload = function(){
    toon_shader = p.loadShader('src/glsl/toon.vert', 'src/glsl/toon.frag');
    obj = p.loadModel('src/assets/stasis.obj');
  }
  
  p.draw = function(){
    p.shader(toon_shader);
    l_pos[0] = 200 * p.sin(p.millis() / 10000);

    toon_shader.setUniform('uLightPosition',l_pos);
    
    p.background(252,252,255);
    p.push();
    p.translate(0,0,0);
    p.rotateWithFrameCount(0);
    p.rotateZ(180);
    p.scale(70.0); // change this to scale with screen size for proper displays.
    p.model(obj);
    p.pop();
  }
  p.rotateWithFrameCount = function(offset){
    p.rotateZ((p.frameCount - offset)*0.06);
    p.rotateY((p.frameCount - offset)*0.02);
    p.rotateX((p.frameCount - offset)*0.3);
  }
}

let dimensionality_p5 = new p5(sketch_dimensionality, 'canvas-container-dimensionality');
