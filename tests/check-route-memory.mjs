import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../route-memory.html', import.meta.url), 'utf8');
const match = html.match(/\(function\(\)\{[\s\S]*?\n\}\)\(\);/);
assert.ok(match, '找不到路线复现主脚本');

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
  querySelector() { return new MockElement(); }
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
  Promise,
  Math,
  console
});
vm.runInContext(match[0], context, { filename: 'route-memory.html' });

const api = window.RouteMemory;
assert.ok(api, '路线复现测试接口没有初始化');

for (const [level, config] of Object.entries(api.LEVELS)) {
  for (let round = 0; round < 1000; round++) {
    const question = api.createQuestion(level);
    assert.equal(question.size, config.size, `${level} 网格尺寸错误`);
    assert.ok(question.route.length >= config.min && question.route.length <= config.max, `${level} 路线长度超出范围`);
    assert.equal(new Set(question.route).size, question.route.length, `${level} 路线出现重复格子`);
    question.route.forEach(index => assert.ok(index >= 0 && index < config.size ** 2, `${level} 路线越界`));
    for (let i = 1; i < question.route.length; i++) {
      assert.ok(api.neighbors(question.route[i - 1], config.size).includes(question.route[i]), `${level} 出现不相邻的跳步`);
    }
  }
}

assert.equal(document.getElementById('board').children.length, 16, '默认4×4画板没有正确渲染');
console.log('路线复现检查通过：页面可初始化，3000条随机路线均相邻、不重复且未越界。');
