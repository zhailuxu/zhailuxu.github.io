import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../mirror-puzzle.html', import.meta.url), 'utf8');
const match = html.match(/\(function\(\)\{[\s\S]*?\n\}\)\(\);/);
assert.ok(match, '找不到镜像拼图主脚本');

class MockElement {
  constructor() {
    this.dataset = {};
    this.style = { setProperty() {} };
    this.classList = { add() {}, remove() {}, toggle() {} };
    this.children = [];
    this.hidden = false;
  }
  addEventListener() {}
  appendChild(child) { this.children.push(child); return child; }
  setAttribute() {}
  querySelectorAll() { return []; }
  querySelector() { return new MockElement(); }
  contains() { return true; }
}

const elements = new Map();
const document = {
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, new MockElement());
    return elements.get(id);
  },
  createElement() { return new MockElement(); },
  querySelectorAll() { return []; },
  body: new MockElement(),
  elementFromPoint() { return null; }
};
const window = {
  addEventListener() {},
  Hpx: { speech: { create: () => ({ speak() {}, toggle() {} }) } }
};
const context = vm.createContext({
  window,
  document,
  Hpx: window.Hpx,
  localStorage: { getItem() { return null; }, setItem() {} },
  matchMedia: () => ({ matches: true }),
  setTimeout,
  clearTimeout,
  Math,
  Date,
  console
});
vm.runInContext(match[0], context, { filename: 'mirror-puzzle.html' });

const api = window.MirrorPuzzle;
assert.ok(api, '镜像拼图测试接口没有初始化');

for (const [level, config] of Object.entries(api.LEVELS)) {
  for (const axis of ['vertical', 'horizontal']) {
    for (let round = 0; round < 300; round++) {
      const target = api.generateTarget(config.size, axis, config);
      assert.equal(target.length, config.size ** 2, `${level}/${axis} 网格尺寸错误`);
      let painted = 0;
      for (let row = 0; row < config.size; row++) {
        for (let col = 0; col < config.size; col++) {
          const [mr, mc] = api.mirrorIndex(row, col, axis, config.size);
          assert.equal(target[row * config.size + col], target[mr * config.size + mc], `${level}/${axis} 图案不对称`);
          if (target[row * config.size + col]) painted++;
        }
      }
      assert.ok(painted >= 4, `${level}/${axis} 生成了过空的题目`);
    }
  }
}

assert.equal(document.getElementById('board').children.length, 16, '默认4×4画板没有正确渲染');
console.log('镜像拼图检查通过：页面脚本可初始化，1800幅随机图案全部满足轴对称。');
