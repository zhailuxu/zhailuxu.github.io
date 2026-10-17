import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'carry.html'), 'utf8');
const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .find((source) => source.includes('const speech = Hpx.speech.install'));

if (!script) throw new Error('没有找到 carry.html 的声音讲解脚本');
if (!html.includes('id="speakToggle"') || !html.includes('src="hpx-core.js"')) {
  throw new Error('carry.html 缺少声音开关或公共语音核心');
}

const elements = new Map();
function element(id) {
  if (!elements.has(id)) {
    const states = new Set();
    elements.set(id, {
      id,
      value: id === 'inA' ? '38' : id === 'inB' ? '47' : '',
      textContent: '', innerHTML: '', className: '', disabled: false,
      style: {}, dataset: {},
      classList: {
        add(...names) { names.forEach((name) => states.add(name)); },
        remove(...names) { names.forEach((name) => states.delete(name)); },
        toggle(name, on) { on ? states.add(name) : states.delete(name); },
        contains(name) { return states.has(name); }
      },
      focus() {}, addEventListener() {}
    });
  }
  return elements.get(id);
}

const spoken = [];
let context;
const speechController = {
  speak(text) { spoken.push(String(text)); return Promise.resolve(); },
  stop() {}, toggle() {}
};

context = vm.createContext({
  console, Math, Number, String, Array, Object, Promise,
  parseInt, isNaN, setTimeout, clearTimeout,
  window: { AudioContext: class {}, webkitAudioContext: class {} },
  document: {
    getElementById: element,
    querySelector() { return null; },
    querySelectorAll() { return []; }
  }
});
context.Hpx = {
  speech: {
    install() {
      context.speak = speechController.speak;
      context.toggleSpeak = speechController.toggle;
      return speechController;
    }
  }
};

new vm.Script(script, { filename: 'carry.html#lesson' }).runInContext(context);

async function checkFirstStep(mode, a, b, requiredParts) {
  element('inA').value = String(a);
  element('inB').value = String(b);
  vm.runInContext(`mode='${mode}'; spMs=1; initDemo();`, context);
  spoken.length = 0;
  vm.runInContext('stepFwd();', context);
  await new Promise((resolve) => setTimeout(resolve, 5));
  const narration = spoken.at(-1) || '';
  for (const part of requiredParts) {
    if (!narration.includes(part)) {
      throw new Error(`${a}${mode === 'add' ? '+' : '-'}${b} 的首步讲解缺少“${part}”：${narration}`);
    }
  }
}

await checkFirstStep('add', 38, 47, ['个位', '8加7', '等于15', '写5', '十位进1']);
await checkFirstStep('sub', 52, 28, ['个位', '2比8小', '不够减', '十位借一', '12减8等于4']);

const adjustedTens = vm.runInContext(`buildSub(52,28).steps[1]`, context);
if (adjustedTens.daOrigDisplay !== 4 || adjustedTens.digit !== 2) {
  throw new Error(`52-28 个位借1后，十位应按4-2计算，实际步骤为 ${JSON.stringify(adjustedTens)}`);
}
spoken.length = 0;
vm.runInContext(`mode='sub';spMs=1;document.getElementById('inA').value='52';document.getElementById('inB').value='28';initDemo();stepFwd();stepFwd();`, context);
await new Promise((resolve) => setTimeout(resolve, 8));
if (!spoken.some((text) => text.includes('十位，4减2等于2'))) {
  throw new Error(`52-28 十位朗读没有使用借位后的4：${spoken.join(' | ')}`);
}

const acrossZero = vm.runInContext(`buildSub(302,178).steps`, context);
if (acrossZero[0].lenderCol !== 2 || acrossZero[1].daOrigDisplay !== 9 || acrossZero[2].daOrigDisplay !== 2) {
  throw new Error(`302-178 连续退位步骤不正确：${JSON.stringify(acrossZero)}`);
}

const additionGrid = vm.runInContext(`
  mode='add';
  (()=>{const data=buildQuizData(38,47);renderQuizWork(data);return {result:data.result,width:data.width,html:document.getElementById('qWork').innerHTML};})()
`, context);
if (additionGrid.result !== 85 || additionGrid.width !== 2 || !additionGrid.html.includes('data-col="0"') || !additionGrid.html.includes('＋')) {
  throw new Error('38+47 没有生成两位、带加号且从个位开始填写的竖式');
}

const subtractionGrid = vm.runInContext(`
  mode='sub';
  (()=>{const data=buildQuizData(502,78);renderQuizWork(data);return {result:data.result,width:data.width,html:document.getElementById('qWork').innerHTML};})()
`, context);
if (subtractionGrid.result !== 424 || subtractionGrid.width !== 3 || !subtractionGrid.html.includes('data-col="2"') || !subtractionGrid.html.includes('－')) {
  throw new Error('502-78 没有生成三位对齐、带减号的竖式');
}

console.log('进位加减法检查通过：借位后数位朗读、连续退位及可填写竖式均已覆盖。');
