#!/usr/bin/env python3
# copies a github user's public repos into assets/repos as plain text, so the viewport
# never waits on github. a repo with a readme keeps only the readme (+ the images it
# points at), one without keeps its code. re-run whenever the repos change:
#   python3 tools/snapshot_repos.py [user]
#
# assets/repos/
#   index.json                  the repo list, newest first: name, description, language,
#                                fork, updated, branch, readme (path or null), images, files
#   <repo>/README.md            readme repos
#   <repo>/<image>              relative images the readme uses
#   <repo>/src/<path>.txt       everything else: code files, stored as .txt
import json
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

USER = sys.argv[1] if len(sys.argv) > 1 else 'jakemorgan011'
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'repos'
API = f'https://api.github.com/users/{USER}/repos?sort=updated&per_page=100'

CODE_EXT = {
    '.js', '.mjs', '.ts', '.html', '.css', '.json', '.frag', '.vert', '.glsl', '.wgsl',
    '.py', '.c', '.cpp', '.cc', '.h', '.hpp', '.lua', '.sh', '.md', '.txt', '.toml', '.yml',
    '.yaml', '.cmake',
}
CODE_NAMES = {'Makefile', 'CMakeLists.txt'}
SKIP_NAMES = {'package-lock.json'}
# vendored libraries and build output, not the repo's own code
SKIP_DIRS = {'lib', 'node_modules', 'dist', 'build', 'external', 'vendor'}
# a code file bigger than this is generated or vendored
MAX_CODE_BYTES = 80_000
MAX_IMAGE_BYTES = 2_000_000

IMAGE_REF = re.compile(r'!\[[^\]]*\]\(([^)\s]+)|<img[^>]*\bsrc="([^"]+)"')


def fetch_repos():
    req = urllib.request.Request(API, headers={'Accept': 'application/vnd.github+json'})
    with urllib.request.urlopen(req) as r:
        return json.load(r)


def clone(full_name, into):
    subprocess.run(['git', 'clone', '-q', '--depth', '1', f'https://github.com/{full_name}.git', str(into)],
                   check=True)


def find_readme(root):
    for p in sorted(root.iterdir()):
        if p.is_file() and p.name.lower().startswith('readme'):
            return p
    return None


def is_relative(ref):
    return not re.match(r'^[a-z]+:|^/|^#', ref)


def copy_readme(root, readme, dest):
    text = readme.read_text(errors='replace')
    (dest / 'README.md').write_text(text)
    images = []
    for m in IMAGE_REF.finditer(text):
        ref = m.group(1) or m.group(2)
        src = root / ref
        if not is_relative(ref) or not src.is_file() or src.stat().st_size > MAX_IMAGE_BYTES:
            continue
        (dest / ref).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dest / ref)
        images.append(ref)
    return images


def is_code(path, size):
    if path.name in SKIP_NAMES or SKIP_DIRS.intersection(path.parts[:-1]):
        return False
    if path.suffix.lower() not in CODE_EXT and path.name not in CODE_NAMES:
        return False
    return 0 < size <= MAX_CODE_BYTES


def copy_code(root, dest):
    tracked = subprocess.run(['git', '-C', str(root), 'ls-files', '-z'], capture_output=True, check=True)
    files = []
    for name in tracked.stdout.decode().split('\0'):
        if not name:
            continue
        src = root / name
        if not src.is_file() or not is_code(Path(name), src.stat().st_size):
            continue
        out = dest / 'src' / f'{name}.txt'
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(src.read_text(errors='replace'))
        files.append(name)
    return sorted(files)


def snapshot(repo, tmp):
    root = tmp / repo['name']
    clone(repo['full_name'], root)
    dest = OUT / repo['name']
    dest.mkdir(parents=True)
    readme = find_readme(root)
    row = {
        'name': repo['name'],
        'full_name': repo['full_name'],
        'description': repo['description'],
        'language': repo['language'],
        'fork': repo['fork'],
        'updated': repo['pushed_at'][:10],
        'branch': repo['default_branch'],
        'readme': None,
        'images': [],
        'files': [],
    }
    if readme:
        row['readme'] = 'README.md'
        row['images'] = copy_readme(root, readme, dest)
    else:
        row['files'] = copy_code(root, dest)
    return row


def main():
    repos = fetch_repos()
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    rows = []
    with tempfile.TemporaryDirectory() as tmp:
        for repo in repos:
            print(repo['full_name'])
            rows.append(snapshot(repo, Path(tmp)))
    (OUT / 'index.json').write_text(json.dumps(rows, indent=2) + '\n')
    print(f'{len(rows)} repos -> {OUT}')


if __name__ == '__main__':
    main()
