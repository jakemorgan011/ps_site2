export class v {
//needs more later.
  constructor(x,y,z=0,w=0){
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
  // swizzles live on the prototype, see below the class
  d(){
    return Math.sqrt(this.x**2 + this.y**2 + this.z**2 + this.w**2);
  }
  d_o(o){
    return Math.sqrt((o.x - this.x)**2 + (o.y - this.y)**2 + (o.z - this.z)**2 + (o.w - this.w)**2);
  }
};
const sw_k = ['x','y','z','w'];
const sw_gen = (n, pre) => {
  if(pre.length === n){
    v.prototype[pre] = function(){
      return new v(...[...pre].map(c => this[c]));
    };
    return;
  }
  sw_k.forEach(c => sw_gen(n, pre + c));
};
[2,3,4].forEach(n => sw_gen(n, ''));


// i think the classes are fairly intuitive but i'll likely rename them on full release
export class rn {
  constructor(fc = false, rg = true){
    this.t = new v(0,0,0);   // translation, world space
    this.rt = new v(0,0,0);  // euler rotation, radians
    this.lo = new v(0,0,0);  // pivot, local space, applied before the scale
    this.sc = 1;             // uniform scale
    this.fc = fc;            // billboard at the camera
    this.rv = 0;             // bump it and every parent re-uploads this mesh
    this.pa = new Set();     // parents currently holding this
    this.rk = null;          // key inside ir, null once a parent claims it
    this.tk = null;          // key inside ir.tp or ir.dx, same deal
    this.mt = null;          // material. having one is what routes it to an rt
    this.hb = 1;             // hit box multiplier over bx(). sh() sets it
    this.oc = null;          // on click. assign a function, _oc() calls it when ib() holds
    this.dq = null;          // the DBG() overlay quad, made on first use
    this.lk = false;         // screen locked: ignores the camera's yaw. fw() sets it
    this.u32 = new Float32Array(12); // the group 1 uniform, filled by gt32
    if(rg) ir.g().rg(this);
  }
  g(){
    return null;
  }
  bx(){
    return 1;
  }
  br(){
    return this.bx() * this.sc * this.hb;
  }
  ua(){
    return 1;
  }
  sh(k){ 
    this.hb = k;
    return this;
  }
  _sv(){
    for(const p of this.pa) if(p.sv) return p.sv;
    return ir.g().sv;
  }
  nb(sv = this._sv()){
    if(!sv) return null;
    const d = sv.a.z - this.t.z;
    if(d <= 0.1) return null;
    const f = 1 / Math.tan(sv.fv / 2);
    const asp = sv.w / sv.h;
    const hh = this.br() * f / d;
    return {x: (this.t.x - sv.a.x) * f / asp / d, y: (this.t.y - sv.a.y) * f / d, hw: hh / asp, hh};
  }
  ib(sv = this._sv()){ // in bounds: is the pointer over this
    const b = this.nb(sv);
    if(!b) return false;
    return Math.abs(sv.ms.x - b.x) <= b.hw && Math.abs(sv.ms.y - b.y) <= b.hh;
  }
  _oc(e, sv){
    if(this.oc && this.ib(sv)) this.oc(this, e);
    return this;
  }
  DBG(on = true){
    const g = ir.g();
    const d = g.tm ?? g.cv();
    if(on){
      if(!this.dq){
        this.dq = new q(false, false);
        this.dq.ow = this;
      }
      d.ao(this, this.dq);
    } else if(this.dq){
      d.ro(this);
    }
    return this;
  }
  g32(){
    return null;
  }
  gu32(){
    return null;
  }
  gt(){
    return this.t;
  }
  gt32(){
    const a = this.u32;
    a[0] = this.t.x;  a[1] = this.t.y;  a[2] = this.t.z;  a[3] = this.sc;
    a[4] = this.rt.x; a[5] = this.rt.y; a[6] = this.rt.z; a[7] = this.fc ? 1 : 0;
    a[8] = this.lo.x; a[9] = this.lo.y; a[10] = this.lo.z; a[11] = this.lk ? 1 : 0;
    return a;
  }
  st(x,y=0,z=0){
    this.t = new v(x,y,z);
    return this;
  }
  sr(x,y=0,z=0){
    this.rt = new v(x,y,z);
    return this;
  }
  sl(x,y=0,z=0){
    this.lo = new v(x,y,z);
    return this;
  }
  ss(k){ 
    this.sc = k;
    return this;
  }
  sf(b = true){
    this.fc = b;
    return this;
  }
  tc(){
    this.rv++;
    return this;
  }
  sx(m){
    this.mt = mt.of(m);
    if(this.mt && this.gu32()) ir.g().tx(this);
    return this;
  }
};

export class q extends rn { 
  constructor(fc=true, rg=true){
    super(fc, rg);
    this.h = {
      "tl" : new v(-1, 1, 0),
      "tr" : new v(1, 1, 0),
      "bl" : new v(-1, -1, 0),
      "br" : new v(1, -1, 0),
    }
    this.v32 = new Float32Array(18);
    this.u32v = new Float32Array(30);
  }
  g(){
    return this.h;
  }
  bx(){
    let m = 0;
    for(const c of Object.values(this.h)) m = Math.max(m, Math.abs(c.x), Math.abs(c.y));
    return m;
  }
  ua(){
    const c = this.h;
    return Math.abs(c.tr.x - c.tl.x) / Math.max(Math.abs(c.tl.y - c.bl.y), 1e-6);
  }
  _w(){
    const c = this.h;
    return [c.tl, c.bl, c.tr, c.tr, c.bl, c.br];
  }
  g32(){
    const a = this.v32;
    this._w().forEach((p, i) => {
      a[i*3] = p.x;
      a[i*3+1] = p.y;
      a[i*3+2] = p.z;
    });
    return a;
  }
  gu32(){
    const a = this.u32v;
    const uv = [0,1, 0,0, 1,1, 1,1, 0,0, 1,0]; // tl bl tr tr bl br, same as _w()
    this._w().forEach((p, i) => {
      a[i*5] = p.x;
      a[i*5+1] = p.y;
      a[i*5+2] = p.z;
      a[i*5+3] = uv[i*2];
      a[i*5+4] = uv[i*2+1];
    });
    return a;
  }
  fw(sv = this._sv()){ // fit. call if you need viewport sizing
    if(!sv) return this;
    this.lk = true; // it stands in for the screen, so it never turns with the camera
    const hh = (sv.a.z - this.t.z) * Math.tan(sv.fv / 2);
    const hw = hh * sv.w / sv.h;
    this.t = new v(sv.a.x, sv.a.y, this.t.z);
    this.sc = 1;
    const c = this.h;
    if(c.tr.x === hw && c.tr.y === hh) return this;
    c.tl = new v(-hw, hh, 0);
    c.tr = new v(hw, hh, 0);
    c.bl = new v(-hw, -hh, 0);
    c.br = new v(hw, -hh, 0);
    return this.tc();
  }
};

export class o extends rn { // obj
  constructor(fc=false){
    super(fc);
    this.ob = {"v32" : null, "uv32" : null, "vu32" : null, "v" : null, "mn" : null, "mx" : null}; // use o.l(path)
    this.ux = -1; 
  }
  static async l(p, fc=false, mp=null){
    const u = new URL(p, document.baseURI).href;
    const t = await fetch(u).then(r => r.text());
    const ob = new o(fc);
    ob.sm(o._p(t));
    if(mp !== false){
      await ob._m(mp ?? o._ml(t), u);
      ir.g().tx(ob); 
    }
    return ob;
  }
  async _m(mp, u){
    if(!mp) return this;
    const mu = new URL(mp, u).href;
    const t = await fetch(mu).then(r => r.ok ? r.text() : null).catch(() => null);
    const m = t ? mt._p(t, mu) : null;
    if(m) this.mt = m;
    return this;
  }
  static _ml(t){
    const m = t.match(/^\s*mtllib\s+(.+?)\s*$/m);
    return m ? m[1] : null;
  }
  sm(ob){
    this.ob = ob;
    if(ob.mn) this.sl(-(ob.mn.x + ob.mx.x) / 2, -(ob.mn.y + ob.mx.y) / 2, -(ob.mn.z + ob.mx.z) / 2);
    return this.tc();
  }
  g(){
    return this.ob.v;
  }
  g32(){
    return this.ob.v32;
  }
  gu32(){
    const b = this.ob;
    if(!b.uv32) return null;
    if(this.ux !== this.rv){
      const n = b.v32.length / 3;
      const a = b.vu32?.length === n * 5 ? b.vu32 : new Float32Array(n * 5);
      for(let i = 0; i < n; i++){
        a[i*5]   = b.v32[i*3];
        a[i*5+1] = b.v32[i*3+1];
        a[i*5+2] = b.v32[i*3+2];
        a[i*5+3] = b.uv32[i*2];
        a[i*5+4] = b.uv32[i*2+1];
      }
      b.vu32 = a;
      this.ux = this.rv;
    }
    return b.vu32;
  }
  ex(){
    const b = this.ob;
    return b.mn ? new v(b.mx.x - b.mn.x, b.mx.y - b.mn.y, b.mx.z - b.mn.z) : new v(0,0,0);
  }
  bx(){
    const e = this.ex();
    return Math.max(e.x, e.y, e.z) / 2;
  }
  static _p(t){
    const pts = [];
    const uvs = [];
    const trs = [];
    const tuv = [];
    const mn = new v(Infinity, Infinity, Infinity);
    const mx = new v(-Infinity, -Infinity, -Infinity);
    const ix = (a, n) => {
      const i = parseInt(a);
      return i < 0 ? n + i : i - 1;
    };
    for(const ln of t.split('\n')){
      const ps = ln.trim().split(/\s+/);
      if(ps[0] === 'v'){
        const p = new v(+ps[1], +ps[2], +ps[3]);
        mn.x = Math.min(mn.x, p.x); mx.x = Math.max(mx.x, p.x);
        mn.y = Math.min(mn.y, p.y); mx.y = Math.max(mx.y, p.y);
        mn.z = Math.min(mn.z, p.z); mx.z = Math.max(mx.z, p.z);
        pts.push(p);
      } else if(ps[0] === 'vt'){
        uvs.push(new v(+ps[1], +ps[2]));
      } else if(ps[0] === 'f'){
        for(let i = 2; i < ps.length - 1; i++){
          [ps[1], ps[i], ps[i+1]].forEach(cn => {
            const sp = cn.split('/');
            trs.push(pts[ix(sp[0], pts.length)]);
            tuv.push(sp[1] ? uvs[ix(sp[1], uvs.length)] : null);
          });
        }
      }
    }
    const v32 = new Float32Array(trs.length * 3);
    trs.forEach((c, i) => {
      v32[i*3] = c.x;
      v32[i*3+1] = c.y;
      v32[i*3+2] = c.z;
    });
    let uv32 = null;
    if(uvs.length){
      uv32 = new Float32Array(trs.length * 2);
      tuv.forEach((w, i) => {
        uv32[i*2] = w ? w.x : 0;
        uv32[i*2+1] = w ? w.y : 0;
      });
    } else if(trs.length){
      uv32 = o._bu(v32, mn, mx);
    }
    const ob = {v32, uv32, vu32: null, v: pts, mn, mx};
    if(!pts.length){
      ob.mn = null;
      ob.mx = null;
    }
    return ob;
  }
  static _bu(v32, mn, mx){
    const lo = [mn.x, mn.y, mn.z];
    const ex = [mx.x - mn.x || 1, mx.y - mn.y || 1, mx.z - mn.z || 1];
    const n = v32.length / 9;
    const uv = new Float32Array(n * 6);
    for(let t = 0; t < n; t++){
      const b = t * 9;
      const ax = v32[b+3] - v32[b], ay = v32[b+4] - v32[b+1], az = v32[b+5] - v32[b+2];
      const bx = v32[b+6] - v32[b], by = v32[b+7] - v32[b+1], bz = v32[b+8] - v32[b+2];
      const nx = ay * bz - az * by;
      const ny = az * bx - ax * bz;
      const nz = ax * by - ay * bx;
      const px = Math.abs(nx), py = Math.abs(ny), pz = Math.abs(nz);
      let iu = 0, iv = 1, fu = nz < 0, fv = false;    // facing z: x across, y up
      if(px >= py && px >= pz){ iu = 2; fu = nx > 0; }   // facing x: z across
      else if(py >= pz){ iv = 2; fu = false; fv = ny > 0; } // facing y: x across, z up
      for(let c = 0; c < 3; c++){
        const u = (v32[b + c*3 + iu] - lo[iu]) / ex[iu];
        const w = (v32[b + c*3 + iv] - lo[iv]) / ex[iv];
        uv[t*6 + c*2] = fu ? 1 - u : u;
        uv[t*6 + c*2 + 1] = fv ? 1 - w : w;
      }
    }
    return uv;
  }
};

export class mt {
  constructor(kd = null){
    this.kd = kd;   
    this.bp = null; 
    this.tx = null; 
    this.sm = null; 
    this.rv = 0;    
    this.ld = false;
  }
  static of(x, sm = null){
    if(!x) return null;
    if(x instanceof mt) return x;
    if(x instanceof ft) return x.m;
    if(x instanceof r) return x.ot?.m ?? null;
    if(typeof x === 'string' || x instanceof URL) return mt.mk(new URL(x, document.baseURI).href);
    if(mv.is(x)) return new mv(x);
    if(x instanceof HTMLImageElement) return mt.mk(x.currentSrc || x.src);
    return mt.f(x, sm);
  }
  static mk(u){
    const e = new URL(u).pathname.split('.').pop().toLowerCase();
    if(mv.ex.includes(e)) return new mv(u);
    if(mg.ex.includes(e)) return new mg(u);
    return new mt(u);
  }
  static f(tx, sm = null){
    const m = new mt();
    m.tx = tx;
    m.sm = sm;
    m.ld = true;
    return m;
  }
  async up(dv){
    if(!this.sm) this.sm = dv.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'repeat',
      addressModeV: 'repeat',
    });
    if(this.ld) return this;
    this.ld = true; 
    try {
      await this._ld(dv);
    } catch(e) {
      this.tx = null; 
    }
    return this;
  }
  async _ld(dv){
    if(!this.kd) return;
    const bl = await fetch(this.kd).then(x => x.blob());
    const bm = await mt._bm(bl, dv.limits.maxTextureDimension2D);
    this._cp(dv, bm, bm.width, bm.height);
    bm.close();
  }
  fr(sv){
    return this;
  }
  _cp(dv, src, w, h){
    dv.queue.copyExternalImageToTexture({source: src}, {texture: this._tx(dv, w, h)}, [w, h]);
    return this;
  }
  _wt(dv, d, w, h){
    dv.queue.writeTexture({texture: this._tx(dv, w, h)}, d, {bytesPerRow: w * 4}, [w, h]);
    return this;
  }
  _tx(dv, w, h){
    if(!this.tx || this.tx.width !== w || this.tx.height !== h){
      this.tx?.destroy();
      this.tx = dv.createTexture({
        size: [w, h],
        format: 'rgba8unorm-srgb',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      });
      this.rv++;
    }
    return this.tx;
  }
  static async _bm(bl, lm){
    const bm = await createImageBitmap(bl, {colorSpaceConversion: 'none'});
    if(bm.width <= lm && bm.height <= lm) return bm;
    const k = lm / Math.max(bm.width, bm.height);
    const rs = await createImageBitmap(bl, {
      resizeWidth: Math.max(1, Math.floor(bm.width * k)),
      resizeHeight: Math.max(1, Math.floor(bm.height * k)),
      colorSpaceConversion: 'none',
    });
    bm.close();
    return rs;
  }
  static _p(t, u){
    let kd = null;
    let bp = null;
    for(const ln of t.split('\n')){
      const ps = ln.trim().split(/\s+/);
      if(ps[0] === 'map_Kd') kd = mt._u(ps, u);
      else if(ps[0] === 'map_Bump' || ps[0] === 'bump') bp = mt._u(ps, u);
    }
    if(!kd) return null;
    const m = mt.mk(kd);
    m.bp = bp;
    return m;
  }
  static _u(ps, u){
    let i = 1;
    while(i < ps.length && ps[i].startsWith('-')) i += 2;
    let p = ps.slice(i).join(' ').replace(/\\/g, '/');
    if(!p) return null;
    if(p.startsWith('/') || /^[a-zA-Z]:\//.test(p)) p = p.split('/').pop();
    return new URL(p, u).href;
  }
}

export class ma extends mt {
  constructor(kd = null){
    super(kd);
    this.k = 1;     
    this.ct = 0;    
    this.tf = null; 
    this.fn = -1;   
  }
  sp(k){
    this.k = k;
    return this;
  }
  fr(sv){
    if(this.fn === sv.fn) return this;
    this.fn = sv.fn;
    if(this.tf !== null) this.ct += (sv.tm - this.tf) * this.k;
    this.tf = sv.tm;
    return this._f(sv.dv);
  }
  _f(dv){
    return this;
  }
}

export class mg extends ma {
  static ex = ['gif', 'webp', 'apng'];
  constructor(kd = null){
    super(kd);
    this.fs = []; 
    this.ce = []; 
    this.nf = 0;  
    this.fi = -1; 
  }
  async _ld(dv){
    if(!this.kd) return;
    const bl = await fetch(this.kd).then(x => x.blob());
    const ty = bl.type || `image/${new URL(this.kd).pathname.split('.').pop().toLowerCase()}`;
    if(typeof ImageDecoder === 'undefined' || !await ImageDecoder.isTypeSupported(ty)){
      if(ty === 'image/gif') return this._gl(dv, new Uint8Array(await bl.arrayBuffer()));
      console.warn(`mg: no ImageDecoder for ${ty} here, ${this.kd} plays as a still`);
      return super._ld(dv);
    }
    const lm = dv.limits.maxTextureDimension2D;
    const dc = new ImageDecoder({data: await bl.arrayBuffer(), type: ty});
    await dc.tracks.ready;
    await dc.completed; 
    this.nf = dc.tracks.selectedTrack.frameCount;
    let t = 0;
    for(let i = 0; i < this.nf; i++){
      const {image} = await dc.decode({frameIndex: i});
      const du = image.duration ?? 0; 
      this.fs.push(await mt._bm(image, lm));
      image.close();
      t += du > 10000 ? du / 1e6 : 0.1; 
      this.ce.push(t);
      if(i === 0) this._sf(dv, 0); 
    }
    dc.close();
    if(this.nf < 2){
      this.fs.forEach(bm => bm.close());
      this.fs = [];
    }
  }
  _gl(dv, b){
    const g = mg._gf(b);
    let t = 0;
    for(const f of g.fs){
      t += f.du > 0.01 ? f.du : 0.1;
      this.fs.push({d: f.d, width: g.w, height: g.h});
      this.ce.push(t);
    }
    this.nf = this.fs.length;
    if(this.nf) this._sf(dv, 0);
    if(this.nf < 2) this.fs = [];
  }
  _sf(dv, i){
    const f = this.fs[i];
    this.fi = i;
    return f.d ? this._wt(dv, f.d, f.width, f.height) : this._cp(dv, f, f.width, f.height);
  }

  // need a good programmer to verify if this is good.
  // this is mostly just back and forth with claude on setting up a gif
  static _gf(b){
    const w = b[6] | b[7] << 8;
    const h = b[8] | b[9] << 8;
    let p = 13;
    let gt = null;
    if(b[10] & 0x80){
      const n = 3 * (1 << ((b[10] & 7) + 1));
      gt = b.subarray(p, p + n);
      p += n;
    }
    const cv = new Uint8Array(w * h * 4);
    const fs = [];
    let gc = {dp: 0, tr: -1, du: 0}; 
    let pv = null;                   
    let sv = null;                   
    while(p < b.length){
      const k = b[p++];
      if(k === 0x3B) break;
      if(k === 0x21){
        if(b[p] === 0xF9){
          const f = b[p + 2];
          gc = {dp: (f >> 2) & 7, tr: f & 1 ? b[p + 5] : -1, du: (b[p + 3] | b[p + 4] << 8) / 100};
        }
        p++;
        while(b[p]) p += b[p] + 1;
        p++;
        continue;
      }
      if(k !== 0x2C) break; 
      const fx = b[p] | b[p + 1] << 8;
      const fy = b[p + 2] | b[p + 3] << 8;
      const fw = b[p + 4] | b[p + 5] << 8;
      const fh = b[p + 6] | b[p + 7] << 8;
      const f = b[p + 8];
      p += 9;
      let ct = gt;
      if(f & 0x80){
        const n = 3 * (1 << ((f & 7) + 1));
        ct = b.subarray(p, p + n);
        p += n;
      }
      const mc = b[p++];
      let ln = 0;
      for(let q = p; b[q]; q += b[q] + 1) ln += b[q];
      const dt = new Uint8Array(ln);
      for(let o = 0; b[p]; p += b[p] + 1){
        dt.set(b.subarray(p + 1, p + 1 + b[p]), o);
        o += b[p];
      }
      p++;

      if(pv?.dp === 2){
        for(let y = pv.y; y < Math.min(pv.y + pv.h, h); y++) cv.fill(0, (y * w + pv.x) * 4, (y * w + Math.min(pv.x + pv.w, w)) * 4);
      } else if(pv?.dp === 3 && sv){
        cv.set(sv);
      }
      if(gc.dp === 3) sv = cv.slice();

      const ix = mg._lz(mc, dt, fw * fh);
      const rw = mg._rw(fh, f & 0x40);
      for(let r = 0; r < fh; r++){
        const y = fy + rw[r];
        if(y >= h) continue;
        for(let x = 0; x < fw && fx + x < w; x++){
          const c = ix[r * fw + x];
          if(c === gc.tr || !ct || c * 3 >= ct.length) continue;
          const o = (y * w + fx + x) * 4;
          cv[o] = ct[c * 3];
          cv[o + 1] = ct[c * 3 + 1];
          cv[o + 2] = ct[c * 3 + 2];
          cv[o + 3] = 255;
        }
      }
      fs.push({d: cv.slice(), du: gc.du});
      pv = {dp: gc.dp, x: fx, y: fy, w: fw, h: fh};
      gc = {dp: 0, tr: -1, du: 0};
    }
    return {w, h, fs};
  }
  static _rw(n, il){
    if(!il) return Array.from({length: n}, (_, i) => i);
    const rw = [];
    for(const [a, st] of [[0, 8], [4, 8], [2, 4], [1, 2]]) for(let y = a; y < n; y += st) rw.push(y);
    return rw;
  }
  static _lz(mc, bs, n){
    const out = new Uint8Array(n);
    const cl = 1 << mc;
    const pf = new Int16Array(4096);
    const sx = new Uint8Array(4096);
    const st = new Uint8Array(4097);
    for(let i = 0; i < cl; i++) sx[i] = i;
    let cs = mc + 1;
    let cm = (1 << cs) - 1;
    let av = cl + 2;
    let od = -1;
    let fc = 0;
    let bt = 0;
    let nb = 0;
    let op = 0;
    for(let bp = 0; op < n;){
      while(nb < cs && bp < bs.length){
        bt |= bs[bp++] << nb;
        nb += 8;
      }
      if(nb < cs) break;
      let c = bt & cm;
      bt >>>= cs;
      nb -= cs;
      if(c === cl){
        cs = mc + 1;
        cm = (1 << cs) - 1;
        av = cl + 2;
        od = -1;
        continue;
      }
      if(c === cl + 1) break;
      if(od === -1){
        out[op++] = sx[c];
        od = c;
        fc = c;
        continue;
      }
      const ic = c;
      let sp = 0;
      if(c >= av){
        st[sp++] = fc;
        c = od;
      }
      while(c > cl + 1){
        st[sp++] = sx[c];
        c = pf[c];
      }
      fc = sx[c];
      st[sp++] = fc;
      while(sp && op < n) out[op++] = st[--sp];
      if(av < 4096){
        pf[av] = od;
        sx[av] = fc;
        av++;
        if((av & cm) === 0 && av < 4096){
          cs++;
          cm += av;
        }
      }
      od = ic;
    }
    return out;
  }
  _f(dv){
    const n = this.fs.length;
    if(n < 2 || n < this.nf) return this; // a still, or the loop isn't all decoded yet
    const d = this.ce[n - 1];
    const t = ((this.ct % d) + d) % d;
    let i = 0;
    while(i < n - 1 && this.ce[i] <= t) i++;
    if(i !== this.fi) this._sf(dv, i);
    return this;
  }
}

export class mv extends ma {
  static ex = ['mp4', 'mov', 'm4v', 'webm', 'ogv'];
  static is(x){
    return x instanceof HTMLVideoElement || x instanceof HTMLCanvasElement
      || (typeof MediaStream !== 'undefined' && x instanceof MediaStream)
      || (typeof OffscreenCanvas !== 'undefined' && x instanceof OffscreenCanvas);
  }
  constructor(x = null){
    const u = typeof x === 'string';
    super(u ? x : null);
    this.el = u ? null : x; 
    this.vt = -1;           
  }
  sp(k){
    super.sp(k);
    const el = this.el;
    if(!(el instanceof HTMLVideoElement)) return this;
    if(k > 0){
      el.playbackRate = k;
      this.pl();
    } else {
      el.pause();
    }
    return this;
  }
  pl(){
    const el = this.el;
    if(!(el instanceof HTMLVideoElement)) return this;
    el.play()?.catch(() => window.addEventListener('pointerdown', () => this.pl(), {once: true}));
    return this;
  }
  async _ld(dv){
    if(!this.el || this.el instanceof MediaStream) this.el = mv._v(this.el ?? this.kd);
    this.sp(this.k);
  }
  static _v(x){
    const el = document.createElement('video');
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
    el.crossOrigin = 'anonymous'; 
    if(x instanceof MediaStream) el.srcObject = x;
    else el.src = x;
    return el;
  }
  _f(dv){
    const el = this.el;
    if(!el) return this;
    const vd = el instanceof HTMLVideoElement;
    const w = vd ? el.videoWidth : el.width;
    const h = vd ? el.videoHeight : el.height;
    if(!w || !h || (vd && el.readyState < 2)) return this;
    if(vd){
      if(this.tx && el.currentTime === this.vt) return this;
      this.vt = el.currentTime;
    }
    return this._cp(dv, el, w, h);
  }
}

export class ft {
  constructor(w = 0, h = 0, cl = null){
    this.w = w;          // 0 follows the viewport
    this.h = h;
    this.cl = cl;        // clear colour, null takes the viewport's
    this.tx = null;      // GPUTexture, colour
    this.dp = null;      // GPUTexture, depth. every pipeline carries a depth state
    this.aw = 0;         // size the textures were last made at
    this.ah = 0;
    this.m = mt.f(null); // what rt.fb() / rf.fb() bind. rv bumps when tx is remade
  }
  g(sv){
    const w = Math.max(1, Math.floor(this.w || sv.w));
    const h = Math.max(1, Math.floor(this.h || sv.h));
    if(this.tx && this.aw === w && this.ah === h) return this;
    this.tx?.destroy();
    this.dp?.destroy();
    this.tx = sv.dv.createTexture({
      size: [w, h],
      format: sv.f,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.dp = sv.dv.createTexture({
      size: [w, h],
      format: s.df,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.aw = w;
    this.ah = h;
    if(!this.m.sm) this.m.sm = sv.dv.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });
    this.m.tx = this.tx;
    this.m.rv++;
    return this;
  }
}

const VL20 = [{
  arrayStride: 20,
  attributes: [
    {shaderLocation: 0, offset: 0, format: 'float32x3'},
    {shaderLocation: 1, offset: 12, format: 'float32x2'},
  ],
}];
const TEX = new URL('../wgsl/core/tex.wgsl', import.meta.url).href;
const GIF = new URL('../assets/default.gif', import.meta.url).href; // what a loaded obj with no mtl wears

export class r {
  static ab = {
    color: {srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha'},
    alpha: {srcFactor: 'one', dstFactor: 'one-minus-src-alpha'},
  };
  constructor(o, sv){
    this.o = o ?? new Map(); // a map of objects to be rendered, key -> anything with g32()
    this.sv = sv;       // the s viewport, owns the device and the swapchain format
    this.pl = null;     // GPURenderPipeline, built by s()
    this.sp = null;     // path of the shader this parent loaded
    this.b = new Map(); // key -> {bf, vn, rv}, vertex buffer + the revision in it
    this.u = new Map(); // key -> {ub, bg}, the per object transform uniform
    this.ch = [];       // child parents, drawn after this one
    this.pp = new Set();// parents that adopted this one. more than one is a join
    this.bl = null;     // blend descriptor, null until a layer declares one. sb()
    this.vp = null;     // vertex layer entry point, null = transform.wgsl's own. vx()
    this.ot = null;     // frame target. null records into the swapchain. tt()
    this.uv = new Map();// uniform name -> what su() was handed. outlives a shader reload
    this.pm = null;     // the shader's group 3 uniforms: layout, cpu copies, buffers, bind group
  }
  tt(x = true, h = 0){
    if(x === true) this.ot = new ft();
    else if(typeof x === 'number') this.ot = new ft(x, h);
    else this.ot = x instanceof ft ? x : null;
    return this;
  }
  get dv(){
    return this.sv.dv;
  }
  get pr(){
    return this.pp.values().next().value ?? null;
  }
  set pr(p){
    if(p) this.pp.add(p);
  }
  ac(c){
    if(this.ch.includes(c)) return c;
    c.pp.add(this);
    if(!c.sv) c.sv = this.sv;
    this.ch.push(c);
    c.ad?.(this); 
    ir.g().gb();
    return c;
  }
  ao(k, a){
    this.o.set(k, a);
    if(a instanceof rn){
      if(!(this instanceof ir)) ir.g().dg(a);
      a.pa.add(this);
    }
    return a;
  }
  ro(k){
    const a = this.o.get(k);
    this.b.get(k)?.bf.destroy();
    this.u.get(k)?.ub.destroy();
    this.o.delete(k);
    this.b.delete(k);
    this.u.delete(k);
    if(a instanceof rn) a.pa.delete(this);
    return a;
  }
  vl(){
    return [{
      arrayStride: 12,
      attributes: [{shaderLocation: 0, offset: 0, format: 'float32x3'}],
    }];
  }
  gv(a){
    return a.g32();
  }
  ve(){
    return this.vp ?? 'vs';
  }
  fe(){
    return 'fs';
  }
  ds(){
    return {format: s.df, depthWriteEnabled: !this.bs(), depthCompare: 'less'};
  }
  bs(){
    return this.bl;
  }
  sb(d = r.ab){
    this.bl = d;
    return this;
  }
  // draw through a vertex layer's entry points instead of transform.wgsl's:
  // n for a pos only parent, n + 't' for a pos+uv one (vsh / vsht). before s()
  vx(n){
    this.vp = n;
    return this;
  }
  async s(p){
    const u = new URL(p, document.baseURI).href;
    const sr = await this.sv._src(u);
    this._ck(u, sr);
    this.sp = u;
    this.pl = this.sv.p(u, sr, this.vl(), this.ds(), this.ve(), this.fe(), this.bs());
    this.u.clear(); 
    this.pm?.bs.forEach(e => e.bf?.destroy());
    this.pm = s._pm(sr);
    this.wn = new Set(); // names already warned about, once per shader
    for(const [k, x] of this.uv) this._pw(k, x);
    return this.pl;
  }
  su(k, x){
    if(typeof k === 'object'){
      for(const [n, y] of Object.entries(k)) this.su(n, y);
      return this;
    }
    this.uv.set(k, x);
    if(this.pl) this._pw(k, x);
    return this;
  }
  gu(k){
    return this.uv.get(k);
  }
  _rs(k){
    const pm = this.pm;
    const e = pm.nm.get(k);
    if(e) return e;
    const m = k.match(/^(.*)\[(\d+)\]$/);
    const a = m ? this._rs(m[1]) : null;
    if(!a?.ly.e || +m[2] >= a.ly.n) return null;
    return {i: a.i, of: a.of + +m[2] * a.ly.sd, ly: a.ly.e};
  }
  _pw(k, x){
    const pm = this.pm;
    const e = pm && this._rs(k);
    if(!e){
      if(!this.wn.has(k)){
        this.wn.add(k);
        console.warn(`${this.sp?.split('/').pop()} has no group 3 uniform called ${k}`);
      }
      return;
    }
    s._wr(pm.bs[e.i].d, e.of, e.ly, x);
    pm.bs[e.i].dt = true;
  }
  ng(){
    return 2;
  }
  _pg(ps){
    const pm = this.pm;
    if(!pm) return;
    for(let i = this.ng(); i < 3; i++) ps.setBindGroup(i, this.sv.eg(this.pl, i));
    for(const e of pm.bs){
      if(!e.bf) e.bf = this.dv.createBuffer({size: e.sz, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
      if(e.dt){
        this.dv.queue.writeBuffer(e.bf, 0, e.ab);
        e.dt = false;
      }
    }
    if(!pm.bg) pm.bg = this.dv.createBindGroup({
      layout: this.pl.getBindGroupLayout(3),
      entries: pm.bs.map(e => ({binding: e.b, resource: {buffer: e.bf}})),
    });
    ps.setBindGroup(3, pm.bg);
  }
  vr(k, a){
    return a.rv;
  }
  _ck(u, sr){
    const f = u.split('/').pop();
    for(const e of [this.ve(), this.fe()]){
      if(new RegExp(`\\bfn\\s+${e}\\s*\\(`).test(sr)) continue;
      const hf = !(this instanceof rf) && /@builtin\(vertex_index\)/.test(sr)
        ? ` it looks like a filter shader, those go on an rf: parent.ac(new rf()).s('${f}')` : '';
      throw new Error(`${f} has no fn ${e}, which a ${this.constructor.name} draws with.${hf}`);
    }
  }
  _b(k, a){
    let e = this.b.get(k);
    const rv = this.vr(k, a);
    if(e && e.rv === rv) return e;
    const gv = this.gv(a, k);
    if(!gv) return null; // mesh hasn't finished loading, or has no uvs for an rt
    let bf = e?.bf;
    if(!bf || bf.size < gv.byteLength){
      bf?.destroy();
      bf = this.dv.createBuffer({
        size: gv.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
    }
    this.dv.queue.writeBuffer(bf, 0, gv);
    e = {bf, vn: gv.byteLength / (this.vl()[0]?.arrayStride ?? 12), rv};
    this.b.set(k, e);
    return e;
  }
  _u(k, a){
    let e = this.u.get(k);
    if(!e){
      const ub = this.dv.createBuffer({
        size: 48,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      e = {ub, bg: this.dv.createBindGroup({
        layout: this.pl.getBindGroupLayout(1),
        entries: [{binding: 0, resource: {buffer: ub}}],
      })};
      this.u.set(k, e);
    }
    this.dv.queue.writeBuffer(e.ub, 0, a.gt32());
    return e.bg;
  }
  dr(ps){
    if(!this.pl) return;
    ps.setPipeline(this.pl);
    ps.setBindGroup(0, this.sv.sg(this.pl));
    this._pg(ps);
    for(const [k, a] of this.o){
      const e = this._b(k, a);
      if(!e) continue;
      ps.setBindGroup(1, this._u(k, a));
      ps.setVertexBuffer(0, e.bf);
      ps.draw(e.vn);
    }
  }
  d(ps){
    this.dr(ps);
    this.ch.forEach(c => c.d(ps));
  }
}

export class ir extends r {
  static _in = null;
  constructor(o, sv){
    super(o, sv);
    this.n = 0;      // running key for auto-registered objects
    this.tp = null;  // the texture parent, an rt built by bt(). objs with an mtl
    this.dx = null;  // the default media parent, an rx on default.gif. objs without one
    this.tq = [];    // objects whose material landed before there was a viewport
    this.tm = null;  // the terminal node. cv() makes everything converge on it
    this.gr = 0;     // graph revision. s caches its draw order against this
  }
  gb(){
    this.gr++;
    return this;
  }
  static g(){
    if(!ir._in) ir._in = new ir(new Map(), null);
    return ir._in;
  }
  static async b(sv, p = new URL('../wgsl/core/base.wgsl', import.meta.url).href,
                 tp = TEX,
                 dp = new URL('../wgsl/core/dbg.wgsl', import.meta.url).href,
                 gp = GIF){
    const rt = ir.g();
    rt.sv = sv;
    await rt.s(p);
    if(tp) await rt.bt(tp, gp);
    if(dp) await rt.cv().s(dp);
    return rt;
  }
  async bt(p = TEX, g = GIF){
    if(this.tp) return this.tp;
    this.tp = this.ac(new rt(new Map(), this, this.sv));
    if(g) this.dx = this.ac(new rx(g, new Map(), this, this.sv));
    await Promise.all([this.tp.s(p), this.dx?.s(p)]);
    const q = this.tq;
    this.tq = [];
    q.forEach(a => this.tx(a));
    return this.tp;
  }
  cv(){
    if(!this.tm){
      this.tm = new rd(new Map(), null, this.sv);
      this.gb();
    }
    const sd = new Set();
    const st = [this, ...(this.sv ? this.sv.m.values() : [])];
    const sn = [];
    while(st.length){
      const n = st.pop();
      if(sd.has(n)) continue;
      sd.add(n);
      if(n !== this.tm && !n.ch.length) sn.push(n);
      n.ch.forEach(c => st.push(c));
    }
    sn.forEach(n => n.ac(this.tm));
    return this.tm;
  }
  tx(a){
    if(a.rk === null && a.tk === null && a.pa.size) return a; 
    if(!a.gu32()) return a;              
    if(!this.tp){
      if(!this.tq.includes(a)) this.tq.push(a);
      return a;
    }
    const p = a.mt ? this.tp : this.dx;
    if(!p || (a.tk !== null && p.o.get(a.tk) === a)) return a; 
    const k = `t${this.n++}`;
    p.ao(k, a); 
    a.tk = k;
    return a;
  }
  async s(p){
    if(this.pl) return this.pl; 
    return super.s(p);
  }
  rg(a){
    const k = `o${this.n++}`;
    a.rk = k;
    this.o.set(k, a);
    return a;
  }
  dg(a){
    if(a.rk !== null){
      this.ro(a.rk);
      a.rk = null;
    }
    if(a.tk !== null){
      for(const p of [this.tp, this.dx]) if(p?.o.get(a.tk) === a) p.ro(a.tk);
      a.tk = null;
    }
    return a;
  }
}

export class rf extends r {
  constructor(f, pr, sv){
    super(new Map(), sv ?? pr?.sv);
    this.f = [];    // explicit inputs. empty means "whatever my parents drew"
    this.pr = pr;   // the parent renderer
    this.sm = null; // GPUSampler
    this.bg = null; // GPUBindGroup wiring sampler+textures into the filter shader
    this.bi = [];   // the mts bg was built over, and their revisions
    this.bv = [];
    if(f) this.fb(f);
  }
  ad(p){
    if(!this.f.length && !p.ot) p.tt();
  }
  in(){
    if(this.f.length) return this.f;
    const ms = [];
    for(const p of this.pp){
      const m = p.ot?.m;
      if(m && !ms.includes(m)) ms.push(m);
    }
    return ms;
  }
  vl(){
    return [];
  }
  ds(){
    return {format: s.df, depthWriteEnabled: false, depthCompare: 'always'};
  }
  async s(p){
    await super.s(p);
    this.sm = this.dv.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });
    this.bg = null;
    return this.pl;
  }
  bd(){
    const ms = this.in();
    for(const m of ms){
      if(!m.ld) m.up(this.dv); 
      m.fr(this.sv);
    }
    if(!this.pl || !ms.length || ms.some(m => !m.tx)) return null;
    const ok = this.bg && ms.length === this.bi.length
      && ms.every((m, i) => m === this.bi[i] && m.rv === this.bv[i]);
    if(ok) return this.bg;
    this.bg = this.dv.createBindGroup({
      layout: this.pl.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: this.sm},
        ...ms.map((m, i) => ({binding: i + 1, resource: m.tx.createView()})),
      ],
    });
    this.bi = ms.slice();
    this.bv = ms.map(m => m.rv);
    return this.bg;
  }
  fb(...t){
    this.f = t.flat().filter(x => x).map(x => {
      if(x instanceof r){
        if(!x.ot) x.tt();
        x.ac(this); 
      }
      return mt.of(x);
    }).filter(x => x);
    this.bg = null;
    return this;
  }
  dr(ps){
    const bg = this.bd();
    if(!this.pl || !bg) return;
    ps.setPipeline(this.pl);
    ps.setBindGroup(0, bg);
    ps.setBindGroup(1, this.sv.sg(this.pl, 1));
    this._pg(ps);
    ps.draw(3); 
  }
}

export class rc extends r { 
  constructor(o, pr, sv){
    super(o, sv ?? pr?.sv);
    this.pr = pr; 
  }
}

export class rd extends rc {
  constructor(o, pr, sv){
    super(o, pr, sv);
    this.sb();
  }
  ds(){
    return {format: s.df, depthWriteEnabled: false, depthCompare: 'always'};
  }
  dr(ps){
    for(const a of this.o.values()){
      const w = a.ow;
      if(!w) continue;
      a.t = w.t;
      a.sc = w.br();
    }
    super.dr(ps);
  }
}

export class ru extends rc {
  vl(){
    return VL20;
  }
  gv(a){
    return a.gu32();
  }
  ve(){
    return `${this.vp ?? 'vs'}t`;
  }
}

export class rt extends ru {
  constructor(o, pr, sv){
    super(o, pr, sv);
    this.mx = new Map(); // key -> mt, assigned here rather than carried by the object
    this.dm = null;      // the parent wide material, what fb() sets
    this.tg = new Map(); // key -> {rv, g}, group 2 for whatever that key resolved to
  }
  ao(k, a, m){
    if(m) this.ax(k, m);
    return super.ao(k, a);
  }
  ax(k, m){
    this.mx.set(k, mt.of(m));
    this.tg.delete(k);
    return this;
  }
  fb(f, sm = null){
    if(f instanceof r){
      if(!f.ot) f.tt();
      f.ac(this);
    }
    this.dm = mt.of(f, sm);
    this.tg.clear();
    return this;
  }
  mf(k, a){
    return this.mx.get(k) ?? a.mt ?? this.dm ?? ir.g().dx?.dm ?? null;
  }
  _sm(m){
    return m.sm;
  }
  _t(k, a){
    const m = this.mf(k, a);
    if(!m) return null;
    m.up(this.dv);         
    m.fr(this.sv);
    if(!m.tx) return null; 
    let e = this.tg.get(k);
    if(!e || e.m !== m || e.rv !== m.rv){
      e = {m, rv: m.rv, g: this.dv.createBindGroup({
        layout: this.pl.getBindGroupLayout(2),
        entries: [
          {binding: 0, resource: this._sm(m)},
          {binding: 1, resource: m.tx.createView()},
        ],
      })};
      this.tg.set(k, e);
    }
    return e.g;
  }
  async s(p){
    this.tg.clear(); 
    return super.s(p);
  }
  ro(k){
    this.tg.delete(k);
    this.mx.delete(k);
    return super.ro(k);
  }
  ng(){
    return 3;
  }
  dr(ps){
    if(!this.pl) return;
    ps.setPipeline(this.pl);
    ps.setBindGroup(0, this.sv.sg(this.pl));
    this._pg(ps);
    for(const [k, a] of this.o){
      const tg = this._t(k, a);
      if(!tg) continue;
      const e = this._b(k, a);
      if(!e) continue;
      ps.setBindGroup(1, this._u(k, a));
      ps.setBindGroup(2, tg);
      ps.setVertexBuffer(0, e.bf);
      ps.draw(e.vn);
    }
  }
}

export class rm extends rt {
  constructor(o, pr, sv){
    super(o, pr, sv);
    this.vp = 'vsm';
  }
}

export class rx extends rt {
  constructor(x = null, o, pr, sv){
    super(o, pr, sv);
    this.fm = 'tl';     // fit: 'tl' tile, 'mr' mirrored tile, 'st' stretch, 'cv' cover
    this.nu = 1;        // tiles across u and v, 'tl' and 'mr' only
    this.nv = 1;
    this.fl = 'linear'; // sampler filter, px() makes it nearest
    this.ws = null;     // the GPUSampler fm + fl describe, made on first bind
    this.sq = null;     // the shader load in flight, so the frame only starts one
    if(x) this.fb(x);
  }
  s(p = TEX){
    this.sq = super.s(p);
    return this.sq;
  }
  mf(k, a){
    return this.mx.get(k) ?? this.dm ?? a.mt ?? ir.g().dx?.dm ?? null;
  }
  fi(m = 'tl', nu = 1, nv = nu){
    this.fm = m;
    this.nu = nu;
    this.nv = nv;
    this.ws = null;
    this.tg.clear();
    return this;
  }
  px(b = true){
    this.fl = b ? 'nearest' : 'linear';
    this.ws = null;
    this.tg.clear();
    return this;
  }
  _sm(m){
    if(!this.ws){
      const w = this.fm === 'tl' ? 'repeat' : this.fm === 'mr' ? 'mirror-repeat' : 'clamp-to-edge';
      this.ws = this.dv.createSampler({
        magFilter: this.fl,
        minFilter: this.fl,
        addressModeU: w,
        addressModeV: w,
      });
    }
    return this.ws;
  }
  _uw(k, a){
    if(this.fm === 'tl' || this.fm === 'mr') return [this.nu, this.nv, 0, 0];
    const tx = this.fm === 'cv' ? this.mf(k, a)?.tx : null;
    if(!tx) return [1, 1, 0, 0];
    const r = (tx.width / tx.height) / a.ua(); // > 1: the picture is wider than the surface
    return r > 1 ? [1 / r, 1, (1 - 1 / r) / 2, 0] : [1, r, 0, (1 - r) / 2];
  }
  vr(k, a){
    return `${a.rv}|${this._uw(k, a)}`;
  }
  gv(a, k){
    const g = super.gv(a);
    const [su, sv, ou, ov] = this._uw(k, a);
    if(!g || (su === 1 && sv === 1 && ou === 0 && ov === 0)) return g;
    const d = new Float32Array(g);
    for(let i = 3; i < d.length; i += 5){
      d[i] = d[i] * su + ou;
      d[i+1] = d[i+1] * sv + ov;
    }
    return d;
  }
  dr(ps){
    if(!this.pl){
      if(!this.sq && this.sv) this.s();
      return;
    }
    super.dr(ps);
  }
}

export class s {
  static df = 'depth24plus';
  static nc = {cache: 'no-cache'};
  constructor(c,w,h,z=false,a = new v(0,0,6)){
    this.c = c;    // the canvas element itself, webgpu pulls its context off this
    this.a = a; // camera pos
    this.w = w; // width
    this.h = h; // height
    this.z = z; // idrk why i have this
    this.fv = Math.PI / 3; // vertical fov, the other half of the projection
    this.yw = 0; // camera yaw about y, radians. 0 looks down -z
    this.pt = 0; // camera pitch after the yaw, radians. positive looks down
    this.tm = 0;    // seconds since boot, handed to every shader
    this.fn = 0;    // frames drawn. moving materials advance once per value of it
    this.ms = new v(0,0); // pointer, -1..1, y up. sm() sets it
    this.cl = {r: 0.988, g: 0.988, b: 1.0, a: 1.0}; // the site's own white. targets clear to it too
    this.dv = null; // GPUDevice, every buffer/pipeline/queue hangs off it
    this.cx = null; // GPUCanvasContext, hands out the swapchain texture each frame
    this.f = null;  // preferred swapchain format for this display
    this.dp = null; // depth texture, remade on resize
    this.sf = null; // GPUBuffer holding the group 0 scene uniform
    this.s32 = new Float32Array(12); // scn is 40 bytes, padded to 48
    this.sb = new Map(); // pipeline -> scene bind groups by group index. layout:'auto' = one each
    this.eb = new Map(); // pipeline -> empty bind groups by group index, for the gaps below group 3
    this.m = new Map();
    this.oc = null; // cached draw order
    this.og = -1;   // the graph revision oc was built at
    this.sl = new Map(); // key -> GPURenderPipeline
    this.md = new Map(); // shader path -> GPUShaderModule
    this.sd = new Map(); // shader path -> promise of its included source
  }
  static fn(){
    return ir.g().sv?.fn ?? 0;
  }
  static async mk(c,w,h,z=false,a = new v(0,0,6)){
    const sc = new s(c,w,h,z,a);
    await sc.i();
    return sc;
  }
  async i(){
    const ad = await navigator.gpu.requestAdapter();
    if(!ad) throw new Error('no webgpu adapter');
    this.dv = await ad.requestDevice();
    this.cx = this.c.getContext('webgpu');
    this.f = navigator.gpu.getPreferredCanvasFormat();
    this.cx.configure({device: this.dv, format: this.f, alphaMode: 'opaque'});
    this.sf = this.dv.createBuffer({
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.rz(this.w, this.h);
  }
  rz(w, h){
    this.w = Math.max(1, Math.floor(w));
    this.h = Math.max(1, Math.floor(h));
    this.c.width = this.w;
    this.c.height = this.h;
    this.dp?.destroy();
    this.dp = this.dv.createTexture({
      size: [this.w, this.h],
      format: s.df,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    return this;
  }
  async _src(p){
    const u = new URL(p, document.baseURI).href;
    let t = this.sd.get(u);
    if(!t){
      t = fetch(u, s.nc).then(x => x.text()).then(x => this._ic(x, u, new Set([u]))).then(x => s._ph(x));
      this.sd.set(u, t);
    }
    return t;
  }
  async _ic(t, u, sn){
    const out = [];
    for(const ln of t.split('\n')){
      const mt = ln.match(/^\s*#i\s+"([^"]+)"/);
      if(!mt){
        out.push(ln);
        continue;
      }
      const iu = new URL(mt[1], u).href;
      if(sn.has(iu)) continue;
      sn.add(iu);
      const it = await fetch(iu, s.nc).then(x => x.text());
      out.push(await this._ic(it, iu, sn));
    }
    return out.join('\n');
  }
  p(k, sr, bl, ds, ve = 'vs', fe = 'fs', bs = null){
    const ky = `${k}|${JSON.stringify(bl)}|${ds.depthCompare}${ds.depthWriteEnabled}|${ve}/${fe}|${bs ? JSON.stringify(bs) : 'op'}`;
    const c = this.sl.get(ky);
    if(c) return c;
    let md = this.md.get(k);
    if(!md){
      md = this.dv.createShaderModule({code: sr});
      this.md.set(k, md);
    }
    const tg = {format: this.f};
    if(bs) tg.blend = bs;
    const pl = this.dv.createRenderPipeline({
      layout: 'auto',  // let webgpu infer bind group layouts from the wgsl
      vertex: {module: md, entryPoint: ve, buffers: bl},
      fragment: {module: md, entryPoint: fe, targets: [tg]},
      primitive: {topology: 'triangle-list'},
      depthStencil: ds,
    });
    this.sl.set(ky, pl);
    return pl;
  }
  tg(w = 0, h = 0, cl = null){ 
    return new ft(w, h, cl).g(this);
  }
  sg(pl, gi = 0){
    let a = this.sb.get(pl);
    if(!a){
      a = [];
      this.sb.set(pl, a);
    }
    if(!a[gi]) a[gi] = this.dv.createBindGroup({
      layout: pl.getBindGroupLayout(gi),
      entries: [{binding: 0, resource: {buffer: this.sf}}],
    });
    return a[gi];
  }
  eg(pl, gi){
    let a = this.eb.get(pl);
    if(!a){
      a = [];
      this.eb.set(pl, a);
    }
    if(!a[gi]) a[gi] = this.dv.createBindGroup({layout: pl.getBindGroupLayout(gi), entries: []});
    return a[gi];
  }

  static _bk(t){
    return t.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, m => m.replace(/[^\n]/g, ' '));
  }
  static _pv(bk){
    const out = [];
    for(const m of bk.matchAll(/((?:@(?:group|binding)\s*\(\s*\d+\s*\)\s*){2})var\s*<\s*uniform\s*>\s*(\w+)\s*:\s*([^;]+);/g)){
      if(+m[1].match(/group\s*\(\s*(\d+)/)[1] !== 3) continue;
      out.push({b: +m[1].match(/binding\s*\(\s*(\d+)/)[1], n: m[2], t: m[3].trim()});
    }
    return out;
  }
  static _sp(t){
    const out = [];
    let dp = 0;
    let st = 0;
    for(let i = 0; i < t.length; i++){
      if(t[i] === '<') dp++;
      else if(t[i] === '>') dp--;
      else if(t[i] === ',' && !dp){
        out.push(t.slice(st, i));
        st = i + 1;
      }
    }
    out.push(t.slice(st));
    return out.map(x => x.trim()).filter(x => x);
  }
  static _ly(t, sd){
    t = t.trim();
    const sc = {f32: 'f', i32: 'i', u32: 'u'};
    if(sc[t]) return {al: 4, sz: 4, k: sc[t], c: 1};
    let m = t.match(/^vec([234])(?:\s*<\s*(f32|i32|u32)\s*>|([fiu]))$/);
    if(m){
      const c = +m[1];
      return {al: c === 2 ? 8 : 16, sz: c * 4, k: m[2] ? sc[m[2]] : m[3], c};
    }
    m = t.match(/^mat([234])x([234])(?:\s*<\s*f32\s*>|f)$/);
    if(m){
      const mc = +m[1];
      const mr = +m[2];
      const cs = mr === 2 ? 8 : 16;
      return {al: cs, sz: mc * cs, k: 'f', mc, mr, cs};
    }
    m = t.match(/^array\s*<([\s\S]+)>$/);
    if(m){
      const [et, nt] = s._sp(m[1]);
      const e = s._ly(et, sd);
      const n = +nt;
      const st = Math.ceil(e.sz / e.al) * e.al;
      return {al: e.al, sz: st * n, e, n, sd: st};
    }
    const fs = sd.get(t);
    if(!fs) throw new Error(`group 3 uniform type ${t} isn't one the engine can lay out`);
    let of = 0;
    let al = 1;
    const f = fs.map(x => {
      const ly = s._ly(x.t, sd);
      const fa = x.al ?? ly.al;
      of = Math.ceil(of / fa) * fa;
      const r = {n: x.n, of, ly};
      of += x.sz ?? ly.sz;
      al = Math.max(al, fa);
      return r;
    });
    return {al, sz: Math.ceil(of / al) * al, f};
  }
  static _pm(t){
    const bk = s._bk(t);
    const vs = s._pv(bk);
    if(!vs.length) return null;
    const sd = new Map();
    for(const m of bk.matchAll(/struct\s+(\w+)\s*\{([^}]*)\}/g)){
      sd.set(m[1], s._sp(m[2]).map(x => {
        const fm = x.match(/^((?:@\w+\s*(?:\([^)]*\))?\s*)*)(\w+)\s*:\s*([\s\S]+)$/);
        const at = fm[1];
        const al = at.match(/@align\s*\(\s*(\d+)/);
        const sz = at.match(/@size\s*\(\s*(\d+)/);
        return {n: fm[2], t: fm[3].trim(), al: al ? +al[1] : undefined, sz: sz ? +sz[1] : undefined};
      }));
    }
    const nm = new Map();
    const bare = new Map(); 
    const bs = vs.map((x, i) => {
      const ly = s._ly(x.t, sd);
      const sz = Math.max(16, Math.ceil(ly.sz / 16) * 16);
      const ab = new ArrayBuffer(sz);
      const walk = (p, of, l) => {
        const e = {i, of, ly: l};
        nm.set(p, e);
        const d = p.indexOf('.');
        if(d > 0) bare.set(p.slice(d + 1), bare.has(p.slice(d + 1)) ? null : e);
        for(const f of l.f ?? []) walk(`${p}.${f.n}`, of + f.of, f.ly);
      };
      walk(x.n, 0, ly);
      return {b: x.b, sz, ab, d: new DataView(ab), bf: null, dt: false};
    });
    for(const [k, e] of bare) if(e && !nm.has(k)) nm.set(k, e);
    return {nm, bs, bg: null};
  }
  static _wr(d, of, ly, x){
    if(ly.f){
      for(const f of ly.f) if(x?.[f.n] !== undefined) s._wr(d, of + f.of, f.ly, x[f.n]);
      return;
    }
    if(ly.e){
      let a = Array.from(x);
      const ec = ly.e.c ?? (ly.e.mc ? ly.e.mc * ly.e.mr : 0);
      if(ec > 1 && typeof a[0] === 'number'){ // flat numbers, cut into elements
        const ch = [];
        for(let i = 0; i < a.length; i += ec) ch.push(a.slice(i, i + ec));
        a = ch;
      }
      for(let i = 0; i < Math.min(a.length, ly.n); i++) s._wr(d, of + i * ly.sd, ly.e, a[i]);
      return;
    }
    const w = ly.k === 'i' ? 'setInt32' : ly.k === 'u' ? 'setUint32' : 'setFloat32';
    if(ly.mc){
      const a = Array.from(x).flat();
      for(let c = 0; c < ly.mc; c++) for(let r = 0; r < ly.mr; r++) d[w](of + c * ly.cs + r * 4, a[c * ly.mr + r] ?? 0, true);
      return;
    }
    const a = typeof x === 'number' || typeof x === 'boolean' ? new Array(ly.c).fill(+x)
      : x instanceof v ? [x.x, x.y, x.z, x.w] : Array.from(x);
    for(let j = 0; j < ly.c; j++) d[w](of + j * 4, a[j] ?? 0, true);
  }
  static _ph(t){
    const bk = s._bk(t);
    const ns = s._pv(bk).map(x => x.n);
    if(!ns.length) return t;
    const rd = ns.map(n => ` _ = ${n};`).join('');
    const at = [];
    for(const m of bk.matchAll(/@(?:vertex|fragment)\b/g)){
      const fn = /\bfn\b/g;
      fn.lastIndex = m.index;
      if(!fn.exec(bk)) continue;
      let i = bk.indexOf('(', fn.lastIndex);
      for(let dp = 0; i < bk.length; i++){
        if(bk[i] === '(') dp++;
        else if(bk[i] === ')' && --dp === 0) break;
      }
      const j = bk.indexOf('{', i);
      if(j > 0) at.push(j + 1);
    }
    for(const j of at.reverse()) t = t.slice(0, j) + rd + t.slice(j);
    return t;
  }
  od(){
    const g = ir.g();
    if(this.oc && this.og === g.gr) return this.oc;
    g.cv(); 
    const rt = [];
    if(g.sv === this) rt.push(g);
    for(const [k, rp] of this.m) rt.push(rp);
    const sd = new Set();
    const st = [...rt];
    while(st.length){
      const n = st.pop();
      if(sd.has(n)) continue;
      sd.add(n);
      n.ch.forEach(c => st.push(c));
    }
    const dg = new Map();
    sd.forEach(n => dg.set(n, 0));
    sd.forEach(n => n.ch.forEach(c => dg.set(c, (dg.get(c) ?? 0) + 1)));
    const qo = [];
    const qb = [];
    const rd = n => (n.bs() ? qb : qo).push(n);
    sd.forEach(n => {
      if(dg.get(n) === 0) rd(n);
    });
    const ot = [];
    while(qo.length || qb.length){
      const n = qo.length ? qo.shift() : qb.shift();
      ot.push(n);
      n.ch.forEach(c => {
        dg.set(c, dg.get(c) - 1);
        if(dg.get(c) === 0) rd(c);
      });
    }
    if(ot.length !== sd.size) throw new Error('render graph has a cycle');
    const sn = ot.filter(n => !n.ch.length);
    if(sn.length > 1) throw new Error(`render graph must converge on one node, found ${sn.length}`);
    this.oc = ot;
    this.og = g.gr;
    return ot;
  }
  sm(cx, cy){
    const b = this.c.getBoundingClientRect();
    this.ms = new v(((cx - b.left) / Math.max(b.width, 1)) * 2 - 1,
                    1 - ((cy - b.top) / Math.max(b.height, 1)) * 2);
    return this;
  }
  _sw(){
    const a = this.s32;
    a[0] = this.a.x; a[1] = this.a.y; a[2] = this.a.z; a[3] = this.w / this.h;
    a[4] = this.fv;  a[5] = this.tm;
    a[6] = this.ms.x; a[7] = this.ms.y; // the old pd slot, already allocated
    a[8] = this.yw; a[9] = this.pt;
    this.dv.queue.writeBuffer(this.sf, 0, a);
  }
  _ps(en, t, cl){
    const g = t?.g(this) ?? null;
    const ld = cl.has(t) ? 'load' : 'clear';
    cl.add(t);
    const ps = en.beginRenderPass({
      colorAttachments: [{
        view: (g ? g.tx : this.cx.getCurrentTexture()).createView(), // the swapchain image is per frame
        clearValue: g?.cl ?? this.cl,
        loadOp: ld,
        storeOp: 'store',        // keep the result, for the compositor or the next pass
      }],
      depthStencilAttachment: {
        view: (g ? g.dp : this.dp).createView(),
        depthClearValue: 1.0,
        depthLoadOp: ld,
        depthStoreOp: 'store',
      },
    });
    ps.setViewport(0, 0, g ? g.aw : this.w, g ? g.ah : this.h, 0, 1);
    return ps;
  }
  d(){
    this.fn++;
    this._sw();
    const en = this.dv.createCommandEncoder();
    const cl = new Set();
    let ps = null;
    let ct = null;
    for(const n of this.od()){
      const t = n.ot ?? null;
      if(!ps || t !== ct){
        ps?.end();
        ps = this._ps(en, t, cl);
        ct = t;
      }
      n.dr(ps);
    }
    if(!cl.has(null)){ 
      ps?.end();
      ps = this._ps(en, null, cl);
    }
    ps.end();                              // closes the pass, no more draws
    this.dv.queue.submit([en.finish()]);   // finish() -> command buffer, submit runs it
  }
  ck(e){
    const sn = new Set();
    for(const n of this.od()){
      for(const a of n.o.values()){
        if(!(a instanceof rn) || sn.has(a)) continue;
        sn.add(a);
        a._oc(e, this);
      }
    }
    return this;
  }
  am(k, rp){
    this.m.set(k, rp);
    if(!rp.sv) rp.sv = this;
    ir.g().gb();
    return rp;
  }
};


export function h(sv, fn){
  const t0 = performance.now();
  function tick(){
    sv.tm = (performance.now() - t0) / 1000;
    if(fn) fn(sv.tm, sv);
    sv.d();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return sv;
}


export function b(a,k){ // imaginary box to host the obj inside of it and scale it to document size. 
  const e = a.ex();
  return a.ss(k / Math.max(e.x, e.y, e.z));
}

// outfacing class. USE THIS
export class sk {
  static DPR = 2; // cap the backing store on retina, 8192 textures are heavy enough

  constructor(c){
    this.c = typeof c === 'string' ? document.getElementById(c) : c;
    this.sv = null;
  }

  cam(){
    return new v(0, 0, 6);
  }
  async setup(sv){}  
  draw(t, sv){}       
  fail(e){
    console.error(e);
  }
  fit(){
    const d = Math.min(window.devicePixelRatio || 1, sk.DPR);
    this.sv.rz(this.c.clientWidth * d, this.c.clientHeight * d);
    return this;
  }

  async run(){
    try {
      if(!navigator.gpu) throw new Error('no webgpu here. chrome/edge, or safari 18+.');
      if(!this.c) throw new Error('sk: no canvas element');
      this.sv = await s.mk(this.c, 1, 1, false, this.cam());
      this.sv.dv.addEventListener('uncapturederror', e => this.fail(e.error));
      this.fit();
      window.addEventListener('resize', () => this.fit());
      window.addEventListener('pointermove', e => this.sv.sm(e.clientX, e.clientY));
      this.c.addEventListener('click', e => this.sv.sm(e.clientX, e.clientY).ck(e));
      await ir.b(this.sv);
      await this.setup(this.sv);
      h(this.sv, (t, sv) => this.draw(t, sv));
    } catch(e){
      this.fail(e);
    }
    return this;
  }
}
