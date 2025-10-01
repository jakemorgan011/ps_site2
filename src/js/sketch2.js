// dimensionality page - simplified without p5 model loader

let sketch_dimensionality = function(p){
  let vertices = [];
  let rotX = 0, rotY = 0, rotZ = 0;
  
  p.setup = function(){
    p.createCanvas(600, 600, p.WEBGL);
    p.angleMode(p.DEGREES);
    console.log('Canvas created');
  };
  
  p.draw = function(){
    p.background(252, 252, 255);
    
    // Lighting
    p.ambientLight(100);
    p.directionalLight(255, 255, 255, 0, 0, -1);
    p.pointLight(255, 255, 255, 100, -100, 100);
    
    p.push();
    
    // Animation
    rotX += 0.3;
    rotY += 0.02;
    rotZ += 0.06;
    p.rotateX(rotX);
    p.rotateY(rotY);
    p.rotateZ(180 + rotZ);
    
    // Material
    p.normalMaterial();
    p.noStroke();
    
    // If we have vertices, draw them as points or a simple mesh
    if (vertices.length > 0) {
      p.scale(200); // Scale to visible size
      
      // Draw vertices as a point cloud
      p.strokeWeight(2);
      p.stroke(255, 100, 100);
      p.beginShape(p.POINTS);
      for (let v of vertices) {
        p.vertex(v.x, v.y, v.z);
      }
      p.endShape();
      
    } else {
      // Default cube
      p.scale(70);
      p.box(1);
    }
    
    p.pop();
  };
  
  // Update vertices from external source
  p.updateVertices = function(newVertices) {
    // Normalize vertices to fit in -1 to 1 range
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    for (let v of newVertices) {
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
      minZ = Math.min(minZ, v.z);
      maxZ = Math.max(maxZ, v.z);
    }
    
    const scaleX = maxX - minX || 1;
    const scaleY = maxY - minY || 1;
    const scaleZ = maxZ - minZ || 1;
    const maxScale = Math.max(scaleX, scaleY, scaleZ);
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    
    // Normalize vertices
    vertices = newVertices.map(v => ({
      x: (v.x - centerX) / maxScale,
      y: (v.y - centerY) / maxScale,
      z: (v.z - centerZ) / maxScale
    }));
    
    console.log(`Updated with ${vertices.length} vertices`);
  };
};

// Initialize sketch
let dimensionality_p5 = new p5(sketch_dimensionality, 'canvas-container-dimensionality');

// Simple OBJ parser integrated with the existing one
document.addEventListener('DOMContentLoaded', () => {
  // Hook into the existing OBJ parser
  const originalObjHandler = document.getElementById('obj-input').onchange;
  
  document.getElementById('obj-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const text = await file.text();
        
        // Parse vertices
        const vertices = [];
        const lines = text.split('\n');
        
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts[0] === 'v') {
            vertices.push({
              x: parseFloat(parts[1]),
              y: parseFloat(parts[2]), 
              z: parseFloat(parts[3])
            });
          }
        }
        
        // Update the sketch with vertices
        if (dimensionality_p5 && vertices.length > 0) {
          dimensionality_p5.updateVertices(vertices);
        }
        
        console.log(`Parsed ${vertices.length} vertices for display`);
        
      } catch (error) {
        console.error('Error parsing OBJ:', error);
      }
    }
  });
});
