import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../pattern-sequence.html', import.meta.url), 'utf8');
const match = html.match(/\(function\(\)\{[\s\S]*?\n\}\)\(\);/);
assert.ok(match, '找不到图案接龙主脚本');

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
  Math,
  console
});
vm.runInContext(match[0], context, { filename: 'pattern-sequence.html' });

const api = window.PatternSequence;
assert.ok(api, '图案接龙测试接口没有初始化');

for (const [level, config] of Object.entries(api.LEVELS)) {
  for (let round = 0; round < 1000; round++) {
    const question = api.createQuestion(level);
    assert.equal(question.sequence.length, config.length, `${level} 序列长度错误`);
    assert.equal(question.choices.length, config.choices, `${level} 选项数量错误`);
    const keys = question.choices.map(api.tokenKey);
    assert.equal(new Set(keys).size, config.choices, `${level} 出现重复选项`);
    assert.ok(keys.includes(api.tokenKey(question.correct)), `${level} 选项中缺少正确答案`);
    assert.ok(question.sequence.every(t => t.color && t.shape && (t.scale === 1 || t.scale === .68)), `${level} 出现无效图案`);
    assert.ok(question.hint.length > 5 && question.explain.length > 5, `${level} 提示或解析缺失`);
  }
}

assert.equal(document.getElementById('answers').children.length, 3, '默认低年级选项没有正确渲染');
console.log('图案接龙检查通过：页面可初始化，3000道随机题目的序列、选项和答案均有效。');
