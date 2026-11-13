// the floating viewport the camera pulls back to. plain html, not drawn on the
// canvas: it's an iframe/list/image with a description beside it, given a css 3d
// transform built from the same camera the shaders use (sv.a, sv.yw, sv.pt, sv.fv),
// so it moves into view with the scene.
//
//   .vp_stage    fixed over the canvas, perspective = the canvas focal length in px
//   +- .vp_cam   the camera: world -> camera space (translate, turn by -yaw, then -pitch)
//      +- .vp_group   one world point (the anchor), turned to face the camera's end pose
//         +- .vp_panel    bar (back / address / open) + body (whatever the view_src mounts)
//         +- .vp_side     title, description, back to the gallery
//
// world -> css px: x * S, -y * S, z * S, with S picked so the panel is exactly its
// css size when it faces the camera head on (S = focal / distance)
//
// once the camera has arrived the stage goes flat (.vp_stage.flat): no perspective,
// no camera chain, the group just translated to where it projects. clicks hit test
// fine through the 3d chain but scrolling doesn't everywhere (pdf, instagram, parts
// of github), so the panel only lives in that chain while it's moving

import {github_url, render_code, render_readme, repo_index, repo_row} from './repos.js';

// framed pages keep their scripts but can't navigate this page away
const FRAME_SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms';
const FRAME_ALLOW = 'fullscreen; picture-in-picture; encrypted-media';
// css draws anything behind the eye inside out, so the panel fades by its nearest
// corner: gone once that corner is NEAR in front of the camera, fully up FADE further out
const NEAR = 0.2;
const FADE = 3.0;
// closing also fades it out over this long from the moment it's asked, so it's mostly
// gone while the camera move back is still slow, instead of flicking out mid move
const CLOSE_FADE_MS = 550;
// instagram's embed posts its height up as {type: 'MEASURE', details: {height}} and
// expects the page to size the iframe to it, it never scrolls inside itself
const INSTAGRAM = 'https://www.instagram.com';

// world offset from the camera -> camera space, transform.wgsl's view() in js
function to_cam(sv, x, y, z){
  const cy = Math.cos(sv.yw), sy = Math.sin(sv.yw);
  const cp = Math.cos(sv.pt), sp = Math.sin(sv.pt);
  const x1 = x * cy - z * sy;
  const z1 = x * sy + z * cy;
  return {x: x1, y: y * cp - z1 * sp, z: y * sp + z1 * cp};
}

// a point in the group's own plane (x right, y up) -> world offset from the anchor.
// the group faces the camera's end pose, so this is that pose's turn run backwards
function from_face(face, x, y){
  const cp = Math.cos(face.pt), sp = Math.sin(face.pt);
  const cy = Math.cos(face.yw), sy = Math.sin(face.yw);
  const y1 = y * cp;
  const z1 = -y * sp;
  return {x: x * cy + z1 * sy, y: y1, z: -x * sy + z1 * cy};
}

function el(tag, cls = '', text = ''){
  const e = document.createElement(tag);
  if(cls) e.className = cls;
  if(text) e.textContent = text;
  return e;
}

// what the viewport shows. mount() fills the body. label is the address in the bar,
// href is the real page behind it (the bar's open link), null for none
export class view_src {
  constructor(label, href = null){
    this.label = label;
    this.href = href;
  }

  mount(body, vp){}
}

export class frame_src extends view_src {
  constructor(src, label, href = src){
    super(label, href);
    this.src = src;
  }

  // a preloaded copy (viewport.preload) is already sitting in the body, just shown.
  // it can't be moved there, moving an iframe reloads it
  mount(body, vp){
    const kept = vp.kept.get(this.src);
    if(kept){
      kept.classList.remove('vp_parked');
      return;
    }
    body.append(this.make());
  }

  make(){
    const f = el('iframe', 'vp_frame');
    f.src = this.src;
    f.title = this.label;
    // only the origin goes out. youtube refuses to play an embed with no referrer at all
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    f.allow = FRAME_ALLOW;
    f.setAttribute('sandbox', FRAME_SANDBOX);
    return f;
  }
}

// github.com won't be framed and github1s took too long, so repos come from the offline
// snapshot (repos.js): a readme if the repo has one, else its code files, each opening
// highlighted. the open link still goes to github
export class repo_src extends view_src {
  constructor(full_name){
    super(`github.com/${full_name}`, `https://github.com/${full_name}`);
    this.full_name = full_name;
  }

  async mount(body, vp){
    const note = el('p', 'gh_note', 'loading');
    body.append(note);
    try {
      const row = await repo_row(this.full_name);
      if(!row) throw new Error('not in the snapshot');
      note.replaceWith(row.readme ? await this._readme(row) : this._files(row, vp));
    } catch(e){
      note.textContent = `couldn't load it (${e.message}). the open link up top still goes to github.`;
    }
  }

  async _readme(row){
    const md = el('div', 'repo_md');
    await render_readme(row, md);
    return md;
  }

  _files(row, vp){
    const list = el('div', 'gh_list');
    row.files.forEach(path => list.append(this._file(row, path, vp)));
    return list;
  }

  _file(row, path, vp){
    const cut = path.lastIndexOf('/');
    const b = el('button', 'gh_repo gh_file');
    b.type = 'button';
    b.append(el('span', 'gh_name', path.slice(cut + 1)));
    if(cut > 0) b.append(el('span', 'gh_meta', path.slice(0, cut)));
    b.addEventListener('click', vp.push.bind(vp, new code_src(row, path)));
    return b;
  }
}

// one code file out of the snapshot
export class code_src extends view_src {
  constructor(row, path){
    super(`github.com/${row.full_name}/${path}`, github_url(row, path));
    this.row = row;
    this.path = path;
  }

  mount(body){
    const pre = el('pre', 'repo_code');
    const code = el('code');
    pre.append(code);
    body.append(pre);
    render_code(this.row, this.path, code).catch(this._failed.bind(this, code));
  }

  _failed(code, e){
    code.textContent = `couldn't load it (${e.message}). the open link up top still goes to github.`;
  }
}

export class image_src extends view_src {
  constructor(src, label){
    super(label);
    this.src = src;
  }

  mount(body){
    const i = el('img', 'vp_image');
    i.src = this.src;
    i.alt = this.label;
    body.append(i);
  }
}

// a profile can't be framed either, so it's rebuilt from the snapshot: one row per
// repo, newest first. a row opens that repo in the viewport, the bar's back comes back here
export class github_user_src extends view_src {
  constructor(user){
    super(`github.com/${user}`, `https://github.com/${user}`);
    this.user = user;
  }

  async mount(body, vp){
    const list = el('div', 'gh_list');
    const note = el('p', 'gh_note', 'loading repos');
    list.append(note);
    body.append(list);
    try {
      const rs = await repo_index();
      note.remove();
      rs.forEach(r => list.append(this._row(r, vp)));
    } catch(e){
      note.textContent = `couldn't load the repos (${e.message}). the open link up top still works.`;
    }
  }

  _row(r, vp){
    const b = el('button', 'gh_repo');
    b.type = 'button';
    b.append(el('span', 'gh_name', r.name));
    if(r.description) b.append(el('span', 'gh_desc', r.description));
    const meta = [r.language, r.fork ? 'fork' : '', `updated ${r.updated}`].filter(Boolean);
    b.append(el('span', 'gh_meta', meta.join(' / ')));
    b.addEventListener('click', vp.push.bind(vp, new repo_src(r.full_name)));
    return b;
  }
}

// an entries.js row -> what its viewport shows. img is the row's resolved texture url
export function view_of(entry, img){
  const v = entry.view ?? {kind: 'image'};
  if(v.kind === 'frame'){
    const label = entry.href ? entry.href.replace(/^https?:\/\//, '') : entry.title;
    return new frame_src(v.src, label, entry.href ?? v.src);
  }
  if(v.kind === 'github_repo') return new repo_src(v.repo);
  if(v.kind === 'github_user') return new github_user_src(v.user);
  return new image_src(img, entry.title);
}

// html hung in the scene: the stage / cam / group chain above, placed off the canvas
// camera every frame, fading in by depth and out on close. viewport and info_card fill
// the group
export class floater {
  // after: the element the stage goes right after, so the site's ui still sits on top
  constructor(after){
    this.stage = el('div', 'vp_stage');
    this.cam = el('div', 'vp_cam');
    this.group = el('div', 'vp_group');
    this.cam.append(this.group);
    this.stage.append(this.cam);
    after.after(this.stage);

    this.anchor = null;  // world point the group hangs on, null when closed
    this.dist = 1;       // how far the anchor is from the camera, for S
    this.face = {yw: 0, pt: 0}; // the camera pose the group faces
    this.closing = false;
    this.close_t = 0;     // performance.now() when close() was called
  }

  // anchor: world point in front of where the camera ends up, dist: its distance
  // from there, face: that end pose's {yw, pt}
  hang(anchor, dist, face){
    this.anchor = anchor;
    this.dist = dist;
    this.face = face;
    this.closing = false;
    return this;
  }

  // once it's faded all the way out on close
  closed(){}

  // the content stays up until it has faded out
  close(){
    this.closing = true;
    this.close_t = performance.now();
    return this;
  }

  // 1 -> 0 over CLOSE_FADE_MS once closing, eased out like a cosine
  _close_fade(){
    if(!this.closing) return 1;
    const p = Math.min((performance.now() - this.close_t) / CLOSE_FADE_MS, 1);
    return 0.5 + 0.5 * Math.cos(p * Math.PI);
  }

  // css px per world unit at the anchor's distance, so the panel lands at its css size
  scale(sv){
    return window.innerHeight * 0.5 / Math.tan(sv.fv / 2) / this.dist;
  }

  // the world point under the middle of box's bottom edge (an element in the group).
  // the anchor is the group's centre, so the box is measured off it (css y runs down)
  foot_of(sv, p){
    const a = this.anchor;
    const k = this.scale(sv);
    const g = this.group;
    const x = (p.offsetLeft + p.offsetWidth * 0.5 - g.offsetWidth * 0.5) / k;
    const y = (g.offsetHeight * 0.5 - p.offsetTop - p.offsetHeight) / k;
    const d = from_face(this.face, x, y);
    return {x: a.x + d.x, y: a.y + d.y, z: a.z + d.z};
  }

  // once a frame, after the camera has moved. settled: the camera is at the end pose
  place(sv, settled = false){
    if(!this.anchor) return this;
    const k = this.scale(sv);
    const focal = k * this.dist;
    const a = this.anchor;
    const z = this._near_corner_z(sv, this.group.offsetWidth * 0.5 / k, this.group.offsetHeight * 0.5 / k);
    const edge = Math.min(Math.max((-z - NEAR) / FADE, 0), 1);
    const fade = Math.min(edge, this._close_fade());
    const shown = fade > 0;

    const flat = settled && !this.closing;
    this.stage.classList.toggle('flat', flat);
    this.stage.style.setProperty('--vp-focal', `${focal}px`);
    if(flat){
      // the same spot and size the 3d chain lands it at, as a plain 2d transform
      const c = to_cam(sv, a.x - sv.a.x, a.y - sv.a.y, a.z - sv.a.z);
      const s = focal / -c.z / k;
      this.stage.style.perspective = 'none';
      this.cam.style.transform = 'none';
      this.group.style.transform =
        `translate(${focal * c.x / -c.z}px, ${-focal * c.y / -c.z}px) scale(${s}) translate(-50%, -50%)`;
    } else {
      this.stage.style.perspective = `${focal}px`;
      this.cam.style.transform =
        `translateZ(${focal}px) rotateX(${-sv.pt}rad) rotateY(${-sv.yw}rad) ` +
        `translate3d(${-sv.a.x * k}px, ${sv.a.y * k}px, ${-sv.a.z * k}px)`;
      this.group.style.transform =
        `translate3d(${a.x * k}px, ${-a.y * k}px, ${a.z * k}px) ` +
        `rotateY(${this.face.yw}rad) rotateX(${this.face.pt}rad) translate(-50%, -50%)`;
    }
    this.stage.classList.toggle('on', shown);
    this.stage.style.opacity = fade;

    if(this.closing && !shown){
      this.closed();
      this.anchor = null;
      this.closing = false;
    }
    return this;
  }

  // camera space z of whichever corner of the group is nearest the camera. in front
  // is negative
  _near_corner_z(sv, half_w, half_h){
    const a = this.anchor;
    let z = -Infinity;
    for(const [cx, cy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]){
      const d = from_face(this.face, cx * half_w, cy * half_h);
      z = Math.max(z, to_cam(sv, a.x + d.x - sv.a.x, a.y + d.y - sv.a.y, a.z + d.z - sv.a.z).z);
    }
    return z;
  }
}

export class viewport extends floater {
  constructor(after){
    super(after);
    this.panel = el('div', 'vp_panel');
    this.bar = el('div', 'vp_bar');
    this.back = el('button', 'vp_back', '<');
    this.addr = el('span', 'vp_addr');
    this.open_a = el('a', 'vp_open', 'open');
    this.body = el('div', 'vp_body');
    this.side = el('div', 'vp_side');
    this.title = el('h2', 'vp_title');
    this.desc = el('p', 'vp_desc');
    this.more = el('a', 'vp_more');
    this.leave = el('button', 'vp_leave', 'back to gallery');

    this.back.type = 'button';
    this.leave.type = 'button';
    this.open_a.target = '_blank';
    this.open_a.rel = 'noopener noreferrer';
    this.bar.append(this.back, this.addr, this.open_a);
    this.panel.append(this.bar, this.body);
    this.more.target = '_blank';
    this.more.rel = 'noopener noreferrer';
    this.side.append(this.title, this.desc, this.more, this.leave);
    this.group.append(this.panel, this.side);

    this.back.addEventListener('click', this.pop.bind(this));
    this.leave.addEventListener('click', this.on_leave.bind(this));
    window.addEventListener('message', this.on_message.bind(this));

    this.stack = [];     // view_srcs, the one showing last
    this.on_close = null; // the scene's close, the side's back button calls it
    this.kept = new Map(); // frame src -> its preloaded iframe, lives in the body for good
  }

  // frame_srcs to load now and keep. the stage is visibility: hidden while closed, so
  // they still lay out at the panel's size and load as if shown
  preload(srcs){
    for(const s of srcs){
      if(!(s instanceof frame_src) || this.kept.has(s.src)) continue;
      const f = s.make();
      f.classList.add('vp_kept', 'vp_parked');
      this.kept.set(s.src, f);
      this.body.append(f);
    }
    return this;
  }

  // empties the body except the preloaded frames, which only hide
  _clear(){
    for(const c of [...this.body.children]){
      if(c.classList.contains('vp_kept')) c.classList.add('vp_parked');
      else c.remove();
    }
  }

  open(src, entry, anchor, dist, face){
    this.hang(anchor, dist, face);
    this.title.textContent = entry.title ?? '';
    this.desc.textContent = entry.desc ?? '';
    this.more.hidden = !entry.link;
    if(entry.link){
      this.more.textContent = entry.link.text;
      this.more.href = entry.link.href;
    }
    this.stack = [];
    this.push(src);
    return this;
  }

  push(src){
    this.stack.push(src);
    return this._show(src);
  }

  pop(){
    if(this.stack.length < 2) return this;
    this.stack.pop();
    return this._show(this.stack[this.stack.length - 1]);
  }

  _show(src){
    this._clear();
    src.mount(this.body, this);
    this.addr.textContent = src.label;
    this.open_a.hidden = !src.href;
    if(src.href) this.open_a.href = src.href;
    this.back.hidden = this.stack.length < 2;
    return this;
  }

  // the panel's bottom middle, the crop island sits on it
  foot(sv){
    return this.foot_of(sv, this.panel);
  }

  closed(){
    this._clear();
  }

  on_leave(){
    if(this.on_close) this.on_close();
  }

  // an embed asking to be its full height: the iframe grows and the body scrolls it
  on_message(e){
    if(e.origin !== INSTAGRAM || typeof e.data !== 'string') return;
    let m = null;
    try { m = JSON.parse(e.data); } catch(x){ return; }
    const h = m?.type === 'MEASURE' ? m.details?.height : 0;
    if(!h) return;
    for(const f of this.body.querySelectorAll('iframe')){
      if(f.contentWindow !== e.source) continue;
      f.classList.add('vp_tall');
      f.style.height = `${h}px`;
    }
  }


}

// the info view's text: one translucent card, like the viewport's side, hung over
// hangout's platform. content is moved in as is (index.html's section.info)
export class info_card extends floater {
  constructor(after, content){
    super(after);
    this.card = el('div', 'vp_side info_card');
    this.card.append(content);
    this.group.append(this.card);
  }

  foot(sv){
    return this.foot_of(sv, this.card);
  }
}
