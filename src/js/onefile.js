//modern...
export class v {
//needs more later.
  constructor(x,y,z=0,w=0){
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
  xy(){
    return {x,y};
  }
  xyz(){
    return {x,y,z};
  }
  xyzw(){
    return {x,y,z,w};
  }
  d(){
    return Math.sqrt(x**2 + y**2 + z**2 + w**2);
  }
  d_o(v){
    return Math.sqrt((v.x - this.x)**2 + (v.y - this.y)**2 + (v.z - this.z)**2 + (v.w - this.w)**2);
  }
};


export class q { // quad
  constructor(fc=true){//defaults to facing camera
    this.h = {
      "tl" : new v(-1, 1, 0),
      "tr" : new v(1, 1, 0),
      "bl" : new v(-1, -1, 0),
      "br" : new v(1, -1, 0),
    }
    this.t = new v(0,0,0); //translation delete comment later.
  }
  g(){
    this.h
  }
  g32(){
    const c = this.h;
    return new Float32Array([
      c.tl.x, c.tl.y, c.tl.z,
      c.bl.x, c.bl.y, c.bl.z,
      c.tr.x, c.tr.y, c.tr.z,
      c.tr.x, c.tr.y, c.tr.z,
      c.bl.x, c.bl.y, c.bl.z,
      c.br.x, c.br.y, c.br.z,
    ]);
  }
  gt(){ // to find if mouse is inside quad/obj is this.t-mouse.xy, test against projection / bounds
    const tr = this.t;
    return new Float32Array([
      tr.x, tr.y, tr.z,
    ]);
  }
  st(x,y=0,z=0){
    this.t = new v(x,y,z);
  }
  //@jake yeah, store it as a uniform and only re-upload when it's dirty, don't touch the vertex data. but heads up: this.t (the vector) and t() (this method) collide, instance prop shadows the prototype fn so this.t(dx,dy,dz) will throw — rename one
//@jake gpu vertex data stays local, so picking can't read it back. unproject the mouse into world space, subtract this.t to get it back into local space, then hit-test against this.h directly — cheap since h never moves
//@jake no broadcasting in js, arrays don't know they're vectors. subtract this.t from the mouse point once (single v - v), then test that one result against this.h's corners directly. never touch the Float32Array for picking, it's gpu-only packed data
};

export class o { // obj
  // @jake constructors can't be async — swap `new o(p)` for `o.load(p)` below
  constructor(){
    this.ob = {"v32" : null, "v" : null}; // use o.ob = l(path);
    this.t = new v(0,0,0);
  }
  //@jake static's got nothing to do with async, it just means you call o.l(path) instead of instance.l(path), since you don't have an instance yet. call it as many times as you want, each returns its own independent o. but that's also a real bug below: _p is an instance method, this._p inside a static method is undefined since this = the class here not an instance. making _p static too
  static async l(p){
    const t = await fetch(p).then(r => r.text());
    const vs = this._p(t);
    const ob = new o();
    ob.v32 = vs.v32;
    ob.v = vs.v;
    return ob;
  }
  g(){
    return ob.v;
  }
  g32(){
    return ob.v32;
  }
  gt(){
    const tr = this.t;
    return new Float32Array([
      tr.x, tr.y, tr.z,
    ]);
  }
  static _p(t){
    const pts = [];
    const trs = [];
    for(const ln of t.split('\n')){
      const ps = ln.trim().split(/\s+/);
      if(ps[0] === 'v'){
        pts.push(new v(+ps[1], +ps[2], +ps[3]));
      } else if(ps[0] === 'f'){
        for(let i = 1; i <= 3; i++){
          trs.push(pts[parseInt(ps[i]) - 1]);
        }
      }
    }
    const v32 = new Float32Array(trs.length * 3);
    trs.forEach((c, i) => {
      v32[i*3] = c.x;
      v32[i*3+1] = c.y;
      v32[i*3+2] = c.z;
    });
    return {v32, v: pts};
  }
};



// canvas/shader viewport class.
export class s {
  constructor(g,w,h,z=false,a = new v(0,0,0)){
    this.a = a;
    this.g = g;
    this.w = w;
    this.h = h;
    this.z = z;
    this.su = this._c_s(); 
    this.m = new Map();
    this.sl = new Map();
  }
  // i think just 
  _c_s(){
    let su = async function(){
    } 
  }
  _r_c(){ // rednering context
    gl.viewport(a.x,a.y,a.z,gl.drawingBufferWidth, gl.drawingBufferHeight);;
    gl.clearColor(0.91, 0.91, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return gl;
  }
  d(gl){
    for(const [k, a] of this.m){
      const b = gl.createBuffer();
      let tb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, a.g32(), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }
  am(k,a,b){
    this.m.set(k,a);
  }
  
  ts(){
  }
};


export function h(s){ 
}
