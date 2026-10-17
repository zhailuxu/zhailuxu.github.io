import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'chinese-study-plan.html'), 'utf8');
const linkedPages = [...html.matchAll(/class="study-link" href="([^"]+\.html)"/g)]
  .map(match => match[1]);

const expectedPages = [
  'chinese_line.html',
  'chinese_poem.html',
  'hanzi-components.html',
  'hanzi.html',
  'pinyin-listening.html',
  'pinyin.html',
  'punctuation.html',
  'reading_strategy.html',
  'rhetoric.html',
  'shuoshuowen.html',
  'wenyanwen.html',
  'xiezuo.html'
];

assert.ok(linkedPages.length >= expectedPages.length, '学习地图缺少配套学习入口');
assert.deepEqual([...new Set(linkedPages)].sort(), expectedPages, '配套学习页面集合不正确');

for (const page of linkedPages) {
  assert.ok(fs.existsSync(path.join(root, page)), `配套学习页面不存在：${page}`);
}

for (let grade = 1; grade <= 6; grade += 1) {
  const start = html.indexOf(`<section id="g${grade}">`);
  const end = html.indexOf('</section>', start);
  assert.ok(start >= 0 && end > start, `缺少${grade}年级学习区块`);
  assert.match(html.slice(start, end), /class="study-link"/, `${grade}年级没有配套学习入口`);
}

console.log(`语文学习地图链接检查通过：${linkedPages.length} 个入口，${expectedPages.length} 个目标页面均存在。`);
