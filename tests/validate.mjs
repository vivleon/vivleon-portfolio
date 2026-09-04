import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFileSync(join(root, path), 'utf8');
const html = read('index.html');
const css = read('css/style.css');
const javascript = read('js/script.js');

const requiredFiles = [
  'index.html',
  'css/style.css',
  'js/script.js',
  'images/profile.png',
  'images/favicon.svg',
  'docs/screenshots/desktop-light.png',
  'docs/screenshots/desktop-dark.png',
  'docs/screenshots/mobile.png',
  'README.md'
];
requiredFiles.forEach((file) => assert.ok(statSync(join(root, file)), `${file} 파일이 필요합니다.`));

['header', 'nav', 'main', 'section', 'article', 'footer'].forEach((tag) => {
  assert.match(html, new RegExp(`<${tag}[\\s>]`), `${tag} 시맨틱 태그가 필요합니다.`);
});

['home', 'about', 'skills', 'projects', 'contact'].forEach((id) => {
  assert.match(html, new RegExp(`id="${id}"`), `${id} 섹션이 필요합니다.`);
});

assert.match(html, /css\/style\.css/);
assert.match(html, /js\/script\.js" defer/);
assert.doesNotMatch(html, /\sstyle=/i);
assert.doesNotMatch(html, /\sonclick=/i);

const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map(([tag]) => tag);
imageTags.forEach((tag) => assert.match(tag, /\salt="[^"]+"/i, '모든 이미지에 의미 있는 alt가 필요합니다.'));

const labelTargets = [...html.matchAll(/<label\b[^>]*\sfor="([^"]+)"/gi)].map((match) => match[1]);
labelTargets.forEach((target) => assert.match(html, new RegExp(`id="${target}"`), `${target} label 대상이 필요합니다.`));

assert.match(css, /:root\s*{/);
assert.match(css, /\[data-theme="dark"\]/);
assert.match(css, /grid-template-columns:\s*repeat\(auto-fit,\s*minmax/);
assert.match(css, /@media \(min-width: 48rem\)/);
assert.match(css, /@media \(min-width: 64rem\)/);
assert.match(javascript, /addEventListener\('click'/);
assert.match(javascript, /addEventListener\('submit'/);
assert.match(javascript, /addEventListener\('scroll'/);
assert.match(javascript, /addEventListener\('input'/);
assert.match(javascript, /event\.preventDefault\(\)/);
assert.match(javascript, /classList\.toggle/);
assert.match(javascript, /localStorage/);
assert.match(javascript, /IntersectionObserver/);
assert.match(javascript, /async \(\)|async \(event\)/);
assert.match(javascript, /await fetch/);
assert.match(javascript, /\.map\(/);
assert.match(javascript, /\.filter\(/);
assert.match(javascript, /\.forEach\(/);
assert.doesNotMatch(javascript, /\bvar\s+/);
assert.doesNotMatch(html + css + javascript, /react|vue|jquery|bootstrap|tailwind/i);

console.log('정적 요구사항 검증을 통과했습니다.');
