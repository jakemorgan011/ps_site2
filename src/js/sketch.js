

let sketch_horse = function(p){
  let horse;
  p.setup = function(){
    p.createCanvas(300,300,p.WEBGL);
    p.angleMode(p.DEGREES);
    p.normalMaterial();
  };
  p.preload = function(){
    horse = p.loadModel('src/assets/horse.OBJ');
  }
  
  p.draw = function(){
    p.background(252,252,255);
    p.push();
    p.translate(0,0,0);
    p.rotateWithFrameCount(100);
    p.rotateZ(180);
    p.scale(4.0); // change this to scale with screen size for proper displays.
    p.model(horse);
    p.pop();
  }
  p.rotateWithFrameCount = function(offset){
    p.rotateZ(p.frameCount - offset);
    p.rotateY(p.frameCount - offset);
    p.rotateX(p.frameCount - offset);
  }
}

let sketch_cube = function(p){
  let c = p.color(255,255,255,0);
  p.setup = function(){
    p.createCanvas(300,300,p.WEBGL);
    p.angleMode(p.DEGREES);
    p.normalMaterial();
  };
  p.draw = function(){
    let a = p.createA('https://publicservices.bandcamp.com/album/love-songs','public services - bandcamp','_blank');
    a.style('background',c);
    a.style('text-decoration','none');
    a.style('font-size','15px');
    p.background(252,252,255);
    //box
    p.push();
    p.translate(0,0,0);
    p.rotateWithFrameCount(0);
    p.box(75,75,75);
    p.pop();
    a.position(75,150);
  }
  p.rotateWithFrameCount = function(offset){
    p.rotateZ(p.frameCount - offset);
    p.rotateY(p.frameCount - offset);
    p.rotateX(p.frameCount - offset);
  }
}


// taking the template code from p5 docs
// TODO modify the shader code till it makes sense to you!
let sketch_shader = function(p){
  let vertexShader = `
  precision highp float;

  attribute vec3 aPosition;
  attribute vec2 aTexCoord;
  attribute vec4 aVertexColor;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying vec2 vTexCoord;

  void main() {
    // Apply the camera transform
    vec4 viewModelPosition =
      uModelViewMatrix *
      vec4(aPosition, 1.0);

    // Tell WebGL where the vertex goes
    gl_Position =
      uProjectionMatrix *
      viewModelPosition;  

    // Pass along data to the fragment shader
    vTexCoord = aTexCoord;
  }
 `;
  // also from docs
  // TODO: figure out what is actually happening here.
  let fragmentShader = `
  // casey conchinha - @kcconch ( https://github.com/kcconch )
  // louise lessel - @louiselessel ( https://github.com/louiselessel )
  // more p5.js + shader examples: https://itp-xstory.github.io/p5js-shaders/
  // rotate/tile functions from example by patricio gonzalez vivo
  // @patriciogv ( patriciogonzalezvivo.com )

  #ifdef GL_ES
  precision mediump float;
  #endif

  #define PI 3.14159265358979323846

  uniform vec2 resolution;
  uniform float time;
  uniform vec2 mouse;
  varying vec2 vTexCoord;

  vec2 rotate2D (vec2 _st, float _angle) {
      _st -= 0.5;
      _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
      _st += 0.5;
      return _st;
  }

  vec2 tile (vec2 _st, float _zoom) {
      _st *= _zoom;
      return fract(_st);
  }

  vec2 rotateTilePattern(vec2 _st){
    
      //  Scale the coordinate system by 2x2
      _st *= 2.0;
    
      //  Give each cell an index number
      //  according to its position
      float index = 0.0;
      index += step(1., mod(_st.x,2.0));
      index += step(1., mod(_st.y,2.0))*2.0;
    
      //      |
      //  2   |   3
      //      |
      //--------------
      //      |
      //  0   |   1
      //      |
    
      // Make each cell between 0.0 - 1.0
      _st = fract(_st);
    
      // Rotate each cell according to the index
      if(index == 1.0){
          //  Rotate cell 1 by 90 degrees
          _st = rotate2D(_st,PI*0.5);
      } else if(index == 2.0){
          //  Rotate cell 2 by -90 degrees
          _st = rotate2D(_st,PI*-0.5);
      } else if(index == 3.0){
          //  Rotate cell 3 by 180 degrees
          _st = rotate2D(_st,PI);
      }
    
      return _st;
  }

  float concentricCircles(in vec2 st, in vec2 radius, in float res, in float scale) {
      float dist = distance(st,radius);
      float pct = floor(dist*res)/scale;
      return pct;
  }

  void main (void) {
      vec2 st = vTexCoord;
      vec2 mst = gl_FragCoord.xy/mouse.xy;
      float mdist= distance(vec2(1.0,1.0), mst);
    
      float dist = distance(st,vec2(sin(time/10.0),cos(time/10.0)));
      st = tile(st,10.0);
    
      st = rotate2D(st,dist/(mdist/5.0)*PI*2.0);
    
      gl_FragColor = vec4(vec3(concentricCircles(st, vec2(0.0,0.0), 3.0, 1.5),concentricCircles(st, vec2(0.0,0.0), 10.0, 6.0),concentricCircles(st, vec2(0.0,0.0), 20.0, 10.0)),1.0);
  }
  `;
  let the_shader;
  let shader_texture;

  p.setup = function(){
    p.createCanvas(300,300,p.WEBGL);
    p.noStroke();
    p.angleMode(p.DEGREES);
    the_shader = p.createShader(vertexShader,fragmentShader);
  }
  p.draw = function(){
    p.background(252,252,255);
    the_shader.setUniform('resolution', [p.width,p.height]);
    the_shader.setUniform('time', p.millis() / 1000.0);
    the_shader.setUniform('mouse', [p.mouseX,p.map(p.mouseY,0,p.height,p.height,0)]);

    p.shader(the_shader);
    //
    p.push();
    p.rotateX(-p.mouseY);
    p.rotateY(-p.mouseX);
    p.torus(50,25);
    p.pop();
  }
}

function calcAspect(){
}


let horse_p5 = new p5(sketch_horse, 'canvas-container-horse');
let cube_p5 = new p5(sketch_cube, 'canvas-container-cube');
let shader_p5 = new p5(sketch_shader, 'canvas-container-shader');
