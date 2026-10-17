import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../pixel-difference.html', import.meta.url), 'utf8');
const match = html.match(/\(function\(\)\{[\s\S]*?\n\}\)\(\);/);
assert.ok(match, '找不到像素找不同主脚本');

class MockElement {
  constructor() {
    this.dataset = {};
    this.style = { setProperty() {} };
    this.classList = { add() {}, remove() {}, toggle() {} };
    this.children = [];
    this.hidden = false;
    this.disabled = false;
  }
  addEventListener() {}
  appendChild(child) { this.children.push(child); return child; }
  setAttribute() {}
  querySelectorAll() { return []; }
}

const elements = new Map();
const document = {
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, new MockElement());
    return elements.get(id);
  },
  createElement() { return new MockElement(); },
  querySelectorAll() { return []; },
  body: new MockElement()
};
const window = { Hpx: { speech: { create: () => ({ speak() {}, toggle() {} }) } } };
const context = vm.createContext({
  window,
  document,
  Hpx: window.Hpx,
  localStorage: { getItem() { return null; }, setItem() {} },
  matchMedia: () => ({ matches: true }),
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Math,
  Date,
  console
});
vm.runInContext(match[0], context, { filename: 'pixel-difference.html' });

const api = window.PixelDifference;
assert.ok(api, '像素找不同测试接口没有初始化');

for (const [level, config] of Object.entries(api.LEVELS)) {
  for (let round = 0; round < 600; round++) {
    const puzzle = api.createPuzzle(config);
    assert.equal(puzzle.left.length, config.size ** 2, `${level} 左图尺寸错误`);
    assert.equal(puzzle.right.length, config.size ** 2, `${level} 右图尺寸错误`);
    assert.equal(puzzle.differences.length, config.differences, `${level} 差异数量错误`);
    assert.equal(new Set(puzzle.differences).size, config.differences, `${level} 差异位置重复`);
    const actual = puzzle.left.flatMap((value, i) => value === puzzle.right[i] ? [] : [i]);
    assert.equal(JSON.stringify(actual), JSON.stringify([...puzzle.differences].sort((a, b) => a - b)), `${level} 标记位置与实际差异不一致`);
  }
}

assert.equal(document.getElementById('leftBoard').children.length, 16, '默认左侧4×4图没有正确渲染');
assert.equal(document.getElementById('rightBoard').children.length, 16, '默认右侧4×4图没有正确渲染');
console.log('像素找不同检查通过：页面可初始化，1800组随机题目的差异数量和位置全部正确。');
