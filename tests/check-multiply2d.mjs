import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'multiply2d.html'), 'utf8');
const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .find((source) => source.includes('function build2x'));

if (!script) throw new Error('没有找到 multiply2d.html 的步骤生成脚本');

const elements = new Map();
function element(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      id,
      value: id === 'numA' ? '47' : id === 'numB' ? '6' : '',
      textContent: '', innerHTML: '', disabled: false, style: {},
      classList: { toggle() {}, add() {}, remove() {} },
      addEventListener() {}
    });
  }
  return elements.get(id);
}

const context = vm.createContext({
  console, Math, Number, String, Array, Object, Promise,
  parseInt, isNaN, setTimeout, clearTimeout,
  document: {
    getElementById: element,
    querySelectorAll: () => []
  },
  Hpx: {
    speech: { install() {} },
    tabs: { activate() {} }
  },
  speak() {}
});

new vm.Script(script, { filename: 'multiply2d.html#lesson' }).runInContext(context);

function inspect(a, b) {
  return vm.runInContext(`
    build2x(${a}, ${b});
    ({
      stepCount: steps.length,
      multiplySteps: steps.filter(s => s.highlights.state.phase === 'multiply').length,
      addSteps: steps.filter(s => s.highlights.state.phase === 'add').length,
      firstWrittenCells: steps[1].highlights.state.partialRows.flat().filter(v => v !== null).length,
      result: Number(steps.at(-1).highlights.state.resultDigits.slice().reverse().filter(v => v !== null).join('')),
      descriptions: steps.map(s => s.desc),
      hasAdditionSign: (() => {
        curStep=steps.length-1;
        renderStep();
        return document.getElementById('vcDisplay').innerHTML.includes('<span class="vc-op">＋</span>');
      })()
    })
  `, context);
}

for (const [a, b, expected] of [[47, 13, 611], [47, 10, 470], [99, 99, 9801]]) {
  const result = inspect(a, b);
  const expectedMultiplySteps = String(a).length * String(b).length;
  const expectedAddSteps = String(expected).length;
  if (result.multiplySteps !== expectedMultiplySteps) {
    throw new Error(`${a}×${b} 应有 ${expectedMultiplySteps} 个逐位乘法步骤，实际 ${result.multiplySteps}`);
  }
  if (result.addSteps !== expectedAddSteps) {
    throw new Error(`${a}×${b} 应有 ${expectedAddSteps} 个逐列加法步骤，实际 ${result.addSteps}`);
  }
  if (result.firstWrittenCells !== 1) {
    throw new Error(`${a}×${b} 第一次点击只应写出一位，实际写出 ${result.firstWrittenCells} 位`);
  }
  if (result.result !== expected) {
    throw new Error(`${a}×${b} 结果错误：期望 ${expected}，实际 ${result.result}`);
  }
  if (!result.hasAdditionSign) {
    throw new Error(`${a}×${b} 的部分积相加区域缺少加号`);
  }
}

const quizTwoDigit = vm.runInContext(`buildQuizRows(47,13)`, context);
const quizOneDigit = vm.runInContext(`buildQuizRows(47,6)`, context);
if (quizTwoDigit.rows.map(row => row.value).join(',') !== '141,470,611') {
  throw new Error('47×13 的练习竖式应要求填写 141、470、611');
}
if (!quizTwoDigit.rows[1].lockedCols.includes(0)) {
  throw new Error('十位部分积最右侧的错位 0 应自动锁定');
}
if (quizOneDigit.rows.map(row => row.value).join(',') !== '282') {
  throw new Error('一位数乘法练习只应填写最终竖式结果 282');
}
vm.runInContext(`renderQuizWork(buildQuizRows(47,13))`, context);
const quizHtml = element('quizWork').innerHTML;
if (!quizHtml.includes('＋') || !quizHtml.includes('value="0" disabled')) {
  throw new Error('练习竖式缺少部分积加号或自动错位的 0');
}
if (!script.includes('quizMode===1?') || script.includes('Math.random()<0.5?1:2')) {
  throw new Error('练习题型应由用户选择，不能再随机切换一位数/两位数乘法');
}

console.log('乘法逐位演示与可填写竖式检查通过：47×13、47×10、47×6、99×99。');
