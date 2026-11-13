

let sketch_horse = function(p){
  let horse;
  let c = p.color(255,255,255,0);
  p.setup = function(){
    let a = p.createA('https://www.instagram.com/publicservices.web/','public services - instagram','_blank');
    a.style('background',c);
    a.style('text-decoration','line-underneath');
    a.style('color','black');
    a.style('font-size','15px');
    p.createCanvas(300,300,p.WEBGL);
    p.angleMode(p.DEGREES);
    p.normalMaterial();
    a.position(75,150);
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
    let a = p.createA('https://publicservices.bandcamp.com/album/love-songs','public services - bandcamp','_blank');
    a.style('background',c);
    a.style('text-decoration','line-underneath');
    a.style('color','black');
    a.style('font-size','15px');
    p.createCanvas(300,300,p.WEBGL);
    p.angleMode(p.DEGREES);
    p.normalMaterial();
    a.position(75,150);
  };
  p.draw = function(){
    p.background(252,252,255);
    //box
    p.push();
    p.translate(0,0,0);
    p.rotateWithFrameCount(0);
    p.box(75,75,75);
    p.pop();
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
      st = tile(st,4.0);
    
      st = rotate2D(st,dist/(mdist/5.0)*PI*2.0);
    
      gl_FragColor = vec4(vec3(concentricCircles(st, vec2(0.0,0.0), 3.0, 1.5),concentricCircles(st, vec2(0.0,0.0), 10.0, 6.0),concentricCircles(st, vec2(0.0,0.0), 20.0, 10.0)),1.0);
  }
  `;
  let the_shader;
  let shader_texture;
  let c = p.color(255,255,255,0);

  p.setup = function(){
    let a = p.createA('https://github.com/jakemorgan011','jake morgan - github','_blank');
    a.style('background',c);
    a.style('text-decoration','line-underneath');
    a.style('color','black');
    a.style('font-size','15px');
    p.createCanvas(300,300,p.WEBGL);
    p.noStroke();
    p.angleMode(p.DEGREES);
    the_shader = p.createShader(vertexShader,fragmentShader);
    a.position(87,140);
  }
  p.draw = function(){
    p.background(252,252,255);
    the_shader.setUniform('resolution', [p.width,p.height]);
    the_shader.setUniform('time', p.millis() / 400.0);
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

let sketch_pulsar = function(p){
  let pulsar_shader;
  // figure out how to do this
  let vertex_shader = `
  precision highp float;

  attribute vec3 aPosition;
  attribute vec4 aVertexColor;
  attribute vec3 aNormal;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying vec4 vVertexColor;

  uniform float time;
  // there's definitely a better way of doing these lol.
  uniform float BETA;
  uniform float DELTA_TIME;
  
  // here is where everything can break :::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  
  vec3 calculateChaos (in vec3 current_pos){
    vec3 new_pos = current_pos;
    // gonna be a memory tard here and make a bunch of variable.
    // concatinate later....
    float xb = current_pos.x * (-BETA);
    float yb = current_pos.y * (-BETA);
    float zb = current_pos.z * (-BETA);

    float sinx = sin(current_pos.x);
    float siny = sin(current_pos.y);
    float sinz = sin(current_pos.z);
    
    float dt_x = DELTA_TIME*(xb + siny);
    float dt_y = DELTA_TIME*(yb + sinz);
    float dt_z = DELTA_TIME*(zb + sinx);
    
    new_pos.x = new_pos.x + (dt_x);
    new_pos.y = new_pos.x + (dt_y);
    new_pos.z = new_pos.x + (dt_z);
    
    return new_pos;
  }


  // ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  void main(void) {
    vec3 position = aPosition;

    // Add an offset per vertex. There will be a time delay based
    // on the texture coordinates.
    // OLD CODE HERE.....
    position.y += 10.0 * sin(time * 0.01 + position.y * 0.1);


    // TODO:::::
    // chaos is not behaving how i expected fix later::::
    // position = calculateChaos(position);
    


    // Apply the transformations that have been set in p5
    vec4 viewModelPosition = uModelViewMatrix * vec4(position, 1.0);

    // Tell WebGL where the vertex should be drawn
    gl_Position = uProjectionMatrix * viewModelPosition;  

    // Pass along the color of the vertex to the fragment shader
    vVertexColor = aVertexColor;
  }
  `;
  let fragment_shader = `
  precision highp float;

  // Receive the vertex color from the vertex shader
  varying vec4 vVertexColor;

  void main() {
    // Color the pixel with the vertex color
    gl_FragColor = vVertexColor;
  }
  `;
  let pulsar;
  let c = p.color(251,241,253,0);
  p.setup = function(){
    let a = p.createA('gallery.html','jake morgan - gallery');
    a.style('background',c);
    a.style('text-decoration','line-underneath');
    a.style('color','black');
    a.style('font-size','15px');
    pulsar_shader = p.createShader(vertex_shader,fragment_shader);
    p.createCanvas(300,300,p.WEBGL);
    p.angleMode(p.DEGREES);
    p.normalMaterial();
    a.position(100,150);
    pulsar = p.buildGeometry(() => {
      with(p){
        noStroke();
        beginShape(TRIANGLES);
        fill(color('#55F'));
        //
        vertex(-50,50,50);
        vertex(50,50,50);
        vertex(50,50,-50);

        vertex(-50,50,50);
        vertex(50,50,-50);
        vertex(-50,50,-50);

        //
        vertex(-50,50,50);
        vertex(50,50,50);
        vertex(0,-50,0);
        //
        vertex(50,50,50);
        vertex(-50,50,-50);
        vertex(0,-50,0);
        //
        vertex(50,50,-50);
        vertex(-50,50,-50);
        vertex(0,-50,0);
        //
        vertex(-50,50,-50);
        vertex(-50,50,50);
        vertex(0,-50,0);

        endShape();
      }
    });
    pulsar.computeNormals();
  }
  p.draw = function(){
    p.background(252,252,255);
    p.shader(pulsar_shader);
    pulsar_shader.setUniform('time', p.millis());
    // since this is called every frame i gues we can make it cool and dynamic....
    pulsar_shader.setUniform('BETA', 0.02);
    pulsar_shader.setUniform('DELTA_TIME',0.008);
    p.push();
    p.rotateWithFrameCount(150);
    p.model(pulsar); 
    p.pop();
  }
  p.rotateWithFrameCount = function(offset){
    p.rotateZ((p.frameCount - offset)*0.5);
    p.rotateY((p.frameCount - offset)*0.5);
    p.rotateX((p.frameCount - offset)*0.5);
  }
}

let sketch_profile = function(p){
  let c = p.color(255,255,255,0);
  let img;
  // default vertex shader.
  let vertex_shader = `
  attribute vec3 aPosition;
  attribute vec2 aTexCoord;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying vec2 vTexCoord;
  
  void main(){
    vTexCoord = aTexCoord;
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
  }
  `;

  let fragment_shader = `
  precision mediump float;
  
  uniform sampler2D uTexture;
  uniform vec2 resolution;
  uniform float pixelSize;
  varying vec2 vTexCoord;

  void main(){
    // this pixelated the texture on the geometry.
    //vec2 uv = vTexCoord;
    //float dx = pixelSize/resolution.x;
    //float dy = pixelSize/resolution.y;
    //vec2 pixelatedUV = vec2(dx * floor(uv.x/dx), dy * floor(uv.y/dy));
    vec2 pixelCoord = floor(vTexCoord * resolution /pixelSize) * pixelSize / resolution;
    
    vec4 color = texture2D(uTexture, pixelCoord);

    gl_FragColor = color;
  }
  `;
  let shader;
  let pg;
  let pixelSize = 3;
  p.preload = function(){
    img = p.loadImage('src/assets/me.jpg');
  }
  p.setup = function(){
    let a = p.createA('https://publicservices.bandcamp.com/album/love-songs','bio','_blank');
    a.style('background',c);
    a.style('text-decoration','line-underneath');
    a.style('color','black');
    a.style('font-size','15px');
    p.createCanvas(300,300,p.WEBGL);
    p.angleMode(p.DEGREES);
    p.normalMaterial();
    a.position(75,150);
    shader = p.createShader(vertex_shader, fragment_shader);
    pg = p.createGraphics(p.width,p.height, p.WEBGL);
    p.noStroke();
  };
  p.draw = function(){
    pg.background(252,252,255);
    //box
    pg.push();
    pg.noStroke();
    pg.translate(0,0,0);
    pg.rotateX(p.frameCount * 0.01);
    pg.rotateY(p.frameCount * 0.01);
    pg.rotateZ(p.frameCount * 0.01);
    pg.texture(img);
    pg.box(75,75,75);
    pg.pop();
    
    p.shader(shader);
    shader.setUniform('uTexture', pg);
    shader.setUniform('resolution', [p.width, p.height]);
    shader.setUniform('pixelSize', pixelSize);

    p.quad(
      -p.width/2,-p.height/2,
      p.width/2,-p.height/2,
      p.width/2,p.height/2,
      -p.width/2,p.height/2
    );
  }
  p.rotateWithFrameCount = function(offset){
    p.rotateZ(p.frameCount - offset);
    p.rotateY(p.frameCount - offset);
    p.rotateX(p.frameCount - offset);
  }
}

let sketch_stasis = function(p){
  let obj;
  let c = p.color(255,255,255,0);
  let toon_shader;
  let l_pos = [20,-2,0.2];
  p.setup = function(){
    let a = p.createA('dimensionality.html','dimensionality.html');
    a.style('background',c);
    a.style('text-decoration','line-underneath');
    a.style('color','black');
    a.style('font-size','15px');
    p.createCanvas(600,600,p.WEBGL);
    a.position(75,150);
    p.angleMode(p.DEGREES);
    p.noStroke();
    //p.normalMaterial();
  };
  p.preload = function(){
    toon_shader = p.loadShader('src/glsl/toon.vert', 'src/glsl/toon.frag');
    obj = p.loadModel('src/assets/spiky.obj');
  }
  
  p.draw = function(){
    p.shader(toon_shader);
    l_pos[0] = 100;
    //l_pos[0] = 2000 * p.sin(p.millis() / 10000);
    l_pos[2] = 5000;
    l_pos[1] = 200;

    toon_shader.setUniform('uLightPosition',l_pos);
    
    p.background(252,252,255);
    p.push();
    p.translate(0,0,0);
    p.rotateWithFrameCount(0);
    p.rotateZ(180);
    p.scale(90.0); // change this to scale with screen size for proper displays.
    p.model(obj);
    p.pop();
  }
  p.rotateWithFrameCount = function(offset){
    p.rotateZ((p.frameCount - offset)*0.06);
    p.rotateY((p.frameCount - offset)*0.02);
    p.rotateX((p.frameCount - offset)*0.3);
  }
}


function calcAspect(){
}


let horse_p5 = new p5(sketch_horse, 'canvas-container-horse');
let cube_p5 = new p5(sketch_cube, 'canvas-container-cube');
let shader_p5 = new p5(sketch_shader, 'canvas-container-shader');
let pulsar_p5 = new p5(sketch_pulsar, 'canvas-container-pulsar');
let profile_p5 = new p5(sketch_profile, 'canvas-container-profile');
let stasis_p5 = new p5(sketch_stasis, 'canvas-container-stasis');
