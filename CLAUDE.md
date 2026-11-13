# scene1

Strudel's building scene (mn.js, from `/Volumes/pub_disk/strudel/website/public/engine`) with the
spokes form overlaid on a tilted quad, a fisheye over everything, then a fullscreen quad.
WebGPU, plain ES modules, no bundler. Serve the folder (`python3 -m http.server`), `file://` won't load modules.

## structure

```
index.html            canvas#m + pre#e (shader/pipeline errors land here)
engine/               vendored copy of the strudel engine, NOT the spokes submodule
  js/e.js               has vx() (vertex layers), which the submodule's e.js lacks. also camera yaw/pitch:
                        s.yw/s.pt -> scn.yw/pt (s32 is 12 floats, buffer 48), rn.lk -> obj.lk (screen lock)
  wgsl/core/            transform, filter, tex, scn, nv, base, dbg
  wgsl/shaders/         building: tex_mouse_shear(+mouse, shear, mouse_shear), light, redux
                        blob: ps3d (raymarched nodes, reads uScn.tm only)
  assets/               building.obj/.mtl, brick-building.jpeg (45MB), default.gif
src/
  js/scene1.js          the render graph + the s.fn() drivers
  js/ground.js          ball seating: measures the spinning ball's surface under the building's footprint
  js/animations.js      tween (go(sv, to, delay)) + camera_move
  js/gllry.js           gllry_col (owns the items, infinite wrap scroll: wheel + touch drag)
                        + gllry_itm (render parent + one quad, hover px tween, html hover title, oc() opens href)
                        + gllry_rx (depth always) + lens_q (hit test through the fisheye)
  js/lens.js            fisheye.wgsl's radial map + its inverse in js (ndc), for hit tests / html over the canvas
  js/entries.js         the gallery rows: img, title, href, view (what the viewport shows), desc
  js/prints.js          prints_wall: the thumbs in section.prints open big in .print_big (click / esc closes)
  js/viewport.js        floater (css 3d stage/cam/group off the canvas camera, fade, foot_of) ->
                        viewport (panel + side) and info_card (section.info in a .vp_side card).
                        the html viewport (css 3d off the canvas camera, yaw + pitch) + view_src classes:
                        frame_src, repo_src / code_src (offline repo snapshot), github_user_src, image_src
  js/repos.js           reads assets/repos: readme -> markdown (marked), code -> highlight.js. both libs are
                        dynamic imports off jsdelivr, only when a repo opens; code shows plain until they land
  wgsl/basics.wgsl      shape math (copy of spokes/src/wgsl/basics.wgsl)
  wgsl/spokes.wgsl      the spokes form as a vot fragment (reads quad uv, so tilting works)
  wgsl/fisheye.wgsl     rf filter, port of src/glsl/filters/fisheye.frag
  wgsl/building.wgsl    building vertex layer, pointer-relative aim + shear
  wgsl/gllry.wgsl       textured quad with redux done inline (snaps to the screen px grid via uv derivatives)
                        + an OUTLINE_PX border, grey -> yellow on hover (hv uniform), found by inverting xf() back to the quad's -1..1 square
  wgsl/island.wgsl      crop island: texture x 4 toon bands (last one red tinted), lit per face
  wgsl/ball.wgsl        hangout's test_ball toon shader (4 bands, light (0,3,4)) + fake shadow ellipse
  css/style.css
assets/gllry/          gallery textures (applepay, thesis, github, respectbutton_a, engine.gif)
sites/svg/             built copy of ~/Documents/web/svg (index.html, style.css, assets, dist js, no maps).
                        re-copy dist/ after rebuilding there
assets/crop_island/    hangout's farm_platform.obj split by material (grass.obj / farm.obj, each keeps
                        every vertex so they share bounds + pivot) + grass.jpg / farmland.jpg
assets/repos/          offline snapshot of jakemorgan011's public repos: index.json + per repo either README.md
                        (+ its relative images) or src/<path>.txt code files. rebuild: python3 tools/snapshot_repos.py
tools/snapshot_repos.py shallow clones each repo, keeps the readme if there is one, else the code files
assets/prints/         the prints wall: hexswap/2/3.png, epic3.gif (first 5 s of ~/Desktop/epic 3.mp4,
                        top 22px black bar cropped, 480w 12fps), engine.png (frame 96 of engine.gif)
assets/hangout_platform/ hangout's hangout_test.obj split by material (carpet/things/wood/fence, all vertices
                        kept, shared bounds) + textures. fence.png is cut out by alpha in island.wgsl
assets/face_cube/      ps_site2's face cube: cube.obj (every face = whole picture) + me.jpg (512)
assets/test_ball.obj    from ~/Documents/hangout/assets/models (radius ~1.3 sphere)
```

## render graph

Everything draws into one shared target (`scene_t`, first pass clears it, later ones load).
Edges set the order: ball rx -> bldng -> blob rx -> spokes -> fisheye rf -> final rx -> screen.

```
light rf -> redux rf -> bldng rm ----+
ps3d ru -> redux rf -> blob rx ------+-> spokes ru -> fisheye rf -> final rx
                           blob rx -> gllry rx[i] -> spokes ru
```

## gotchas

- The blob's depth is NOT the ps3d quad's. That quad only places the picture on screen (it renders
  offscreen). The building's depth test runs against the fullscreen `blob_q`, so both take `BLOB_Z`.
  BLOB_X/Y are the doorway back-projected to that z. Hidden by the wall, visible through the door.
- The ball renders in its own target (ball rc -> redux rf, px BALL_PIXEL=16, ps 0 -> ball rx), so it has no
  depth in scene_t. `ball_q` is behind the building twice: ball rx draws first, and its quad sits
  BALL_PLANE_MARGIN past the building's back face. Only the ball is pixelated. Because the building is
  always over it, the part of the building sunk into the ball (BALL_SINK) shows over the ball.
- Ball seating: test_ball's radius is 1.26-1.34, so scaled up its surface under the building moves ~2.7 units
  as it spins. `seat_ball()` re-measures it every frame (ground.js) and sets the ball's y so the surface just
  touches the building's base. BALL_SINK = 0 means touching, positive buries the building.
- building.wgsl's rest pose faces the camera (yaw/pitch from the building to the camera), then the pointer
  turns it. BLOB_X/Y are the doorway in that pose; they drift off it as the building turns, by design.
- The spokes swing (basics.wgsl `sway_params`, constant `SWAY` in spokes.wgsl): rest angles stay the even arc,
  spoke j lags j * offset radians of phase (a wave down the arc), amplitude eases in from 0 over `ramp` s.
  `STAR_REACH` neighbors each side must cover swing + shape width, or the swing clips at wedge seams.

- The spokes pass is `overlay extends ru` with depth `always`: the building's bounds contain the
  camera, so a depth-tested overlay gets hidden. Blended (`sb()`) so outside the shape is see-through.
- The tilt needs `new q(false)` (face-camera off), then `sr(x, y, z)` in radians.
- The spokes shader must read the quad's `uv`, not `w.xy`: world xy ignores the tilt.
- Strudel routes used to drive the uniforms by hand; here `drive_building` / `drive_blob` /
  the fisheye line in `draw()` set them from `s.fn()` (frame count).
- `sv.ms` (pointer) feeds `uMouse` on the spokes pass and the building's mouse turn.
- `src/wgsl/building.wgsl` is the building's vertex layer: the engine's mouse turn + shear, but it aims at
  the pointer relative to where the building projects on screen (engine/mouse.wgsl assumes screen centre).
  Same entry names (vsmh/vsmht), engine copy untouched.
- Tuned by Jake: the building is `b(obj, 1.0)` + `ss(1.44)`, not strudel's 2.6 / 3.44.

- Gallery: `this.gllry` in scene1.js is a gllry_col; its constructor array is the item list. Items are sized
  for GLLRY_VISIBLE (2) slots over GLLRY_COL_H, the rest run off the top/bottom and the column wraps forever.
  The wrap period is n * step, stretched if needed so it's always longer than the view + an item each side
  (so the wrap never happens on screen; with few items the spacing grows instead). Scroll only while the
  camera is heading 'gllry'. go_gllry floats them down (staggered); go_home/go_bldng float them back up.
  The gallery camera distance is fit to the column, not just the spokes. px 8 at rest, 2 on hover.
  Idle sway (z rotation) + bob per frame in gllry_itm.step, phase-offset per item.
  Item hit tests go through lens.js so they match what's on screen (the sway is still ignored).
  The building's ib() does NOT, it still tests the pre-fisheye projection.
  Titles are <p class="gllry_title"> made in JS, positioned per frame with transform, fade in on hover.
  FISHEYE_STRENGTH in scene1.js feeds both the filter and the lens, keep them one value.

- Camera yaw + pitch (sv.yw, sv.pt) are new in this engine copy: transform.wgsl's view() turns every
  proj() by yaw then pitch, unless the object is screen locked (uObj.lk). q.fw() sets lk, so the
  fullscreen composites (final_q, blob_q, ball_q, island_q) don't turn with the camera. rotateX in
  transform.wgsl is column major: positive x rotation lifts the far (+z) edge. JS hit tests (nb/ib)
  ignore yaw/pitch, so scene1 gates every canvas hover/click/scroll on live() (no viewport, view_w = 0).
- Gallery click -> go_view: view_w tweens 0 -> 1 and step_view() blends the camera from cam_move's
  pose onto orbit(): swung VIEW_YAW (-70 deg) round the spokes, VIEW_ZOOM (5x) the gallery distance,
  tipped VIEW_PITCH, then turned VIEW_LOOK off the spokes so the scene sits right of centre. Blending by
  the same w means leaving for bldng mid move is still smooth. viewport.js puts the html panel VIEW_DIST
  in front of the end pose (+VIEW_RAISE up), facing it. css 3d from the same camera (perspective =
  canvas focal length, S = focal / dist so it lands at its css size). It fades by its nearest corner's
  depth (css draws behind-the-eye inside out) and on close by time too (CLOSE_FADE_MS), so it's gone
  before the move back speeds up. The panel itself is turned 10 deg in css; .vp_side bobs (vp_float).
  .vp_group must stay pointer-events: none: its flat box sits at z=0 in the same preserve-3d space,
  and the turned panel's right half is behind it, so it would swallow those clicks.
  Esc, 'back to gllry', or any nav goes back.
- Crop island: own rt target -> redux rf (ISLAND_PIXEL) -> island_out (depth always, screen locked quad).
  It's chained spokes -> island_out -> fisheye so it draws last into scene_t, over the ball. seat_island()
  sizes it to ISLAND_FIT of the panel's world width and puts its top just under vp.foot() (the panel's
  bottom edge, measured off the panel's own box, not the group's). Parked at ISLAND_PARK_Y while live,
  otherwise spun ISLAND_SPIN rad/frame about y.
- github.com and github profiles refuse framing (x-frame-options deny), and github1s was too slow, so repos
  and the profile list come from the offline snapshot in assets/repos (no github api calls at runtime).
  A repo with a readme shows only the readme; one without lists its code files, each pushed as a code_src.
  The bar's open link still goes to github. Re-run tools/snapshot_repos.py when the repos change.
  Drive /preview URLs frame fine.
- Preload: entries with view.preload (svg, the thesis Drive pdf) get their iframe made right after reveal
  (vp.preload) and it stays in .vp_body for good, hidden with .vp_parked when another view shows. Never
  move or re-append it: moving an iframe in the dom reloads it. viewport._clear() empties everything else.

- Mobile = MOBILE_QUERY (portrait, or hover: none). The gallery column runs in center mode: the item
  nearest the column centre gets the hover state (unblurred, yellow outline, title) once its float in
  has finished (drop tween inactive), so the title doesn't ride the float in. The column starts
  with item 0 centred, and a touch drag snaps to a slot on release. A .hint p ('scroll to see more') is
  placed over the spokes by place_hint() while the gallery is up. The building gets a local yaw
  (BLDNG_MOBILE_TURN) on top of building.wgsl's face-the-camera pose, leaning toward the spokes, and
  still follows the pointer/taps. The spokes don't: uMouse is held at SPOKES_MOBILE_MOUSE (0, 0),
  which rests the fill square and puts the softness (fluid, off uMouse.x) exactly halfway.
- Test mobile without resizing the window: overlay a 360x640 iframe of the site on the page, it gets
  its own portrait viewport so every media query + PORTRAIT/MOBILE flips.

- Info: orbit(sv, w, pose) takes VIEW_POSE or INFO_POSE (the same orbit mirrored: swung right + out, scene
  left of centre). view_w and info_w each blend the camera onto their orbit in step_view; at w = 0 an orbit
  adds no turn, so the turns just sum and a viewport -> info hop crossfades. go_info sends cam_move home
  (key 'info') underneath. The platform + face cube are extra objects in the island's pass (no new
  targets): parked unless info is up, the island redux drops to PLATFORM_PIXEL while it is. The cube's
  wander is in the platform's obj units and goes through the same pivot/scale/y turn as xf() to land on it.
- Prints: the nav reads 'prints' / 'gallery' but the buttons are still data-view="bldng" / "gllry".
  section.prints is its own element, not inside .shop: .shop is mix-blend-mode difference and would
  invert the images. Portrait overrides for .shop/.prints live in a media block after the desktop rules
  (an earlier portrait block lost to the later desktop ones).
- Testing without the chrome extension: headless chrome does WebGPU. A small node CDP script
  (--headless=new --remote-debugging-port, Page.captureScreenshot, Runtime.evaluate to click nav) works;
  --virtual-time-budget doesn't (no rAF, the scene never reveals).
- The <section class="shop"> copy lives in index.html; body.in_shop is set while cam_move.arrived('bldng') and the
  canvas is live, and style.css floats its lines in staggered, out together. Emails are mailto links.

## objectives

- Overlay the spokes form on the strudel scene, slightly skewed away from the camera.
- Keep each path built separately (`build_*`) so they can be swapped or rerouted.
