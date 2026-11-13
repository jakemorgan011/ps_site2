// the offline copy of the github repos (tools/snapshot_repos.py -> assets/repos) and how
// they're drawn: readmes as markdown, code files highlighted. marked + highlight.js come
// off the cdn the first time a repo is opened, never on page load, and code shows as
// plain text until they arrive

const REPOS = new URL('../../assets/repos/', import.meta.url);
const MARKED = 'https://cdn.jsdelivr.net/npm/marked@12.0.2/lib/marked.esm.js';
const HLJS = 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/es/highlight.min.js';
const HLJS_GLSL = 'https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/es/languages/glsl.min.js';
// extension -> highlight.js language. wgsl has no grammar, rust's reads closest
const LANGS = {
  js: 'javascript', mjs: 'javascript', ts: 'typescript', html: 'xml', css: 'css', json: 'json',
  frag: 'glsl', vert: 'glsl', glsl: 'glsl', wgsl: 'rust', py: 'python', c: 'c', cpp: 'cpp',
  cc: 'cpp', h: 'cpp', hpp: 'cpp', lua: 'lua', sh: 'bash', md: 'markdown', toml: 'ini',
  yml: 'yaml', yaml: 'yaml', cmake: 'cmake',
};

let index_p = null;
let libs_p = null;

function ok_or_throw(r){
  if(!r.ok) throw new Error(`${r.status} ${r.url}`);
  return r;
}

async function fetch_text(url){
  return (await fetch(url).then(ok_or_throw)).text();
}

function forget_index(){
  index_p = null;
}

function forget_libs(){
  libs_p = null;
}

// every repo row, newest first. fetched once per page load
export function repo_index(){
  if(!index_p){
    index_p = fetch(new URL('index.json', REPOS)).then(ok_or_throw).then(r => r.json());
    index_p.catch(forget_index);
  }
  return index_p;
}

export async function repo_row(full_name){
  return (await repo_index()).find(r => r.full_name === full_name) ?? null;
}

export function github_url(row, path = ''){
  const base = `https://github.com/${row.full_name}`;
  return path ? `${base}/blob/${row.branch}/${path}` : base;
}

function local_url(row, path){
  return new URL(`${row.name}/${path}`, REPOS).href;
}

function wire_libs([m, h, glsl]){
  const hljs = h.default;
  hljs.registerLanguage('glsl', glsl.default);
  return {marked: m.marked, hljs};
}

function libs(){
  if(!libs_p){
    libs_p = Promise.all([import(MARKED), import(HLJS), import(HLJS_GLSL)]).then(wire_libs);
    libs_p.catch(forget_libs);
  }
  return libs_p;
}

function lang_of(path){
  return LANGS[path.split('.').pop().toLowerCase()] ?? null;
}

function is_relative(ref){
  return !!ref && !/^([a-z]+:|\/|#)/i.test(ref);
}

// readme images point inside the repo: the snapshot's copy if it kept one, else github's raw file
function fix_img(row, img){
  const ref = img.getAttribute('src');
  if(!is_relative(ref)) return;
  img.src = row.images.includes(ref)
    ? local_url(row, ref)
    : `https://raw.githubusercontent.com/${row.full_name}/${row.branch}/${ref}`;
}

function fix_link(row, a){
  const ref = a.getAttribute('href');
  if(ref?.startsWith('#')) return;
  if(is_relative(ref)) a.href = github_url(row, ref);
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
}

// only fenced blocks that name a language get coloured. the rest (ascii diagrams) stay as typed
function highlight_block(hljs, code){
  const lang = [...code.classList].find(c => c.startsWith('language-'))?.slice(9);
  if(lang && hljs.getLanguage(lang)) hljs.highlightElement(code);
}

export async function render_readme(row, into){
  const text = await fetch_text(local_url(row, row.readme));
  let l = null;
  try { l = await libs(); } catch(e){}
  if(!l){
    const pre = document.createElement('pre');
    pre.textContent = text;
    into.replaceChildren(pre);
    return;
  }
  into.innerHTML = l.marked.parse(text);
  into.querySelectorAll('img').forEach(i => fix_img(row, i));
  into.querySelectorAll('a').forEach(a => fix_link(row, a));
  into.querySelectorAll('pre code').forEach(c => highlight_block(l.hljs, c));
}

export async function render_code(row, path, code){
  const text = await fetch_text(local_url(row, `src/${path}.txt`));
  code.textContent = text;
  const lang = lang_of(path);
  if(!lang) return;
  let l = null;
  try { l = await libs(); } catch(e){ return; }
  if(l.hljs.getLanguage(lang)) code.innerHTML = l.hljs.highlight(text, {language: lang}).value;
}
