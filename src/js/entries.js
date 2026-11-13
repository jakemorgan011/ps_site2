// the gallery, top to bottom. one row per item:
//   img    the quad's texture, in assets/gllry/
//   title  the hover title, and the heading beside the viewport
//   href   the real page. the viewport's open link goes here
//   view   what the viewport shows once the camera spins round (see viewport.js view_of):
//            {kind: 'image'}                       the img, big
//            {kind: 'frame', src}                  any page that allows being framed. local
//                                                  copies live in sites/ (sites/svg = ~/Documents/web/svg).
//                                                  preload: true loads it once the scene is up and keeps it
//            {kind: 'github_repo', repo}           owner/name, out of the offline snapshot in
//                                                  assets/repos (tools/snapshot_repos.py)
//            {kind: 'github_user', user}           the snapshot's repo list, each opens as a github_repo
//   desc   the text to the right of the viewport
//   link   optional {text, href}, a link under the desc (opens in a new tab)
export const ENTRIES = [
  {
    img: 'applepay.png',
    title: 'svg_manipulation',
    view: {kind: 'frame', src: 'sites/svg/index.html', preload: true},
    desc: 'svg_manipulation is a tool i made to stretch svgs by moving their vectors algorithmically along ' +
      'a grid. this keeps their original form in place but allows for deep exploration of the svg drawing ' +
      'format.',
  },
  {
    img: 'thesis.png',
    title: 'BFA thesis',
    href: 'https://drive.google.com/file/d/1sO8jqeWYmtwbPoZatXqKk1VhaMxV9pn8/view',
    view: {
      kind: 'frame',
      src: 'https://drive.google.com/file/d/1sO8jqeWYmtwbPoZatXqKk1VhaMxV9pn8/preview',
      preload: true,
    },
    desc: 'this was my first experience using machine learning as a tool for the arts. i wanted to ' +
      'interpolate and teach a machine to morph between arbitrary shapes. i had previously created a dsp ' +
      'processing algorithm to use geometric data as a control interface for dsp. combining the two created ' +
      'a fun interface that was visually complex and produced extremely unique macro combinations that ' +
      'wouldn\'t be possible otherwise. you could say this is the most complex chaos pad you could have.',
  },
  {
    img: 'github.png',
    title: 'github',
    href: 'https://github.com/jakemorgan011',
    view: {kind: 'github_user', user: 'jakemorgan011'},
    desc: 'this is my github.',
  },
  {
    img: 'respectbutton_a.png',
    title: 'algorithmic_hexswap',
    view: {kind: 'image'},
    desc: 'i made this piece of software to focus on byte level algorithms as a img processing algorithm. ' +
      'this is one of many pieces i\'ve made with this tool. the outcome of this tool is largely determined ' +
      'by the input material. a ruleset was created at the beginning of this project to bring out as much ' +
      'noise as possible.',
    link: {text: 'see on github', href: 'https://github.com/jakemorgan011/algo_hex'},
  },
  {
    img: 'engine.gif',
    title: 'untitled_rendering_engine (what this website runs on)',
    href: 'https://github.com/jakemorgan011/untitled_rendering_engine',
    view: {kind: 'image'},
    desc: 'i think shaders are really cool. interfacing with shaders can become more about memorization ' +
      'of commands and sequential programming. when creating art with shaders i never think sequentially ' +
      'and like to think of the scene or picture as a whole. by abstracting out what i describe as ' +
      'different forms of rendering, i can easily place things on screen as i see fit and manipulate them ' +
      'at will without having to reorder my entire canvas codebase. this creates a \'web-like\' (spider ' +
      'not internet) data structure of renderers. your ideas of fx and layers become sequential, as is ' +
      'natural, whereas your scenes and art become whole.',
    link: {text: 'see on github', href: 'https://github.com/jakemorgan011/untitled_rendering_engine'},
  },
  {
    img: 'creative_coding.png',
    title: 'ADC - Creative Coding',
    href: 'https://www.youtube.com/watch?v=1H5MHSxHbXM',
    view: {kind: 'frame', src: 'https://www.youtube-nocookie.com/embed/1H5MHSxHbXM'},
    desc: 'i made this quite ridiculous system to process audio based on deterministic descriptions of ' +
      'geometry. sharp shapes sound sharp; round shapes sound round. confusing. but the result was great. ' +
      'i gave a small talk about it that mostly focuses on how fun it is and diving into experimental ' +
      'interface design',
  },
  {
    img: 'company.png',
    title: "Extra Firm 'The Company' performance",
    href: 'https://www.instagram.com/p/DZtp94nlPYL/?img_index=6',
    view: {kind: 'frame', src: 'https://www.instagram.com/p/DZtp94nlPYL/embed/captioned/'},
    desc: '1st collaboration under j_word with the amazing @jj_disaster. this was a joint live-code ' +
      'live-visuals set where my strudel fork would provide pattern data to her visual system designed in ' +
      'touchdesigner. shoutout Extra Firm.',
  },
  {
    img: 'extrafirm.png',
    title: "Extra Firm 'OFFSITE.001' recording",
    href: 'https://www.instagram.com/reel/DbfFH9-tsL9/',
    view: {kind: 'frame', src: 'https://www.instagram.com/reel/DbfFH9-tsL9/embed/captioned/'},
    desc: '2nd collaboration under j_word with the amazing @jj_disaster. an ambient set i prepared using ' +
      'my custom fork of strudel alongside her vibrant visuals. we recorded this in the san gabriel ' +
      'mountains with the Extra Firm crew. quite the hike',
  },
];
