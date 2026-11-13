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
  let rand = Math.random()*500;
  p.setup = function(){
    pulsar_shader = p.createShader(vertex_shader,fragment_shader);
    p.createCanvas(100,100,p.WEBGL);
    p.angleMode(p.DEGREES);
    p.normalMaterial();
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
    p.scale(0.33);
    p.rotateWithFrameCount(rand);
    p.model(pulsar); 
    p.pop();
  }
  p.rotateWithFrameCount = function(offset){
    p.rotateZ((p.frameCount - offset)*0.5);
    p.rotateY((p.frameCount - offset)*0.5);
    p.rotateX((p.frameCount - offset)*0.5);
  }
}

function calcAspect(){
}


let pulsar_p5 = new p5(sketch_pulsar, 'canvas-container-pulsar');
let pulsar_p52 = new p5(sketch_pulsar, 'canvas-container-pulsar2');
let pulsar_p53 = new p5(sketch_pulsar, 'canvas-container-pulsar3');
let pulsar_p54 = new p5(sketch_pulsar, 'canvas-container-pulsar4');
let pulsar_p55 = new p5(sketch_pulsar, 'canvas-container-pulsar5');
