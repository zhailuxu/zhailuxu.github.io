import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith('.html'));
const errors = [];
let sharedPageCount = 0;
let corePageCount = 0;

for (const file of htmlFiles) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');

  for (const [index, match] of [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].entries()) {
    if (!match[1].trim()) continue;
    try {
      new vm.Script(match[1], { filename: `${file}#inline-${index + 1}` });
    } catch (error) {
      errors.push(`${file}: JavaScript 语法错误：${error.message}`);
    }
  }

  if (source.includes('data-hpx-page')) {
    sharedPageCount++;
    if (!source.includes('href="hpx-common.css"')) {
      errors.push(`${file}: data-hpx-page 页面没有引用 hpx-common.css`);
    }
    if (!source.includes('--hpx-accent:')) {
      errors.push(`${file}: 没有声明 --hpx-accent 主题色`);
    }
  }

  if (source.includes('Hpx.')) {
    corePageCount++;
    const coreMatch = source.match(/src=["']hpx-core\.js(?:\?[^"']*)?["']/);
    const coreIndex = coreMatch ? coreMatch.index : -1;
    const usageIndex = source.indexOf('Hpx.');
    if (coreIndex < 0 || coreIndex > usageIndex) {
      errors.push(`${file}: Hpx 使用前没有加载 hpx-core.js`);
    }
  }

  if (/speechSynthesis|SpeechSynthesisUtterance/.test(source)) {
    errors.push(`${file}: 页面仍在直接操作 Web Speech API，请改用 hpx-core.js`);
  }

  if (source.includes('let _speakOn=true,_zhVoice=null;')) {
    errors.push(`${file}: 仍包含已迁移的标准语音重复实现`);
  }

  for (const match of source.matchAll(/Hpx\.tabs\.activate\(t, \[([^\]]+)\]\)/g)) {
    const tabIds = [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
    for (const id of tabIds) {
      if (!source.includes(`id="tab-${id}"`)) {
        errors.push(`${file}: Tab 配置 ${id} 没有对应的 #tab-${id} 面板`);
      }
    }
  }
}

for (const asset of ['hpx-core.js', 'hpx-common.css']) {
  if (!fs.existsSync(path.join(root, asset))) errors.push(`缺少共享资源 ${asset}`);
}

// 在轻量浏览器桩上运行公共核心，覆盖 Tab 状态和异步语音完成契约。
const panels = Object.fromEntries(['learn', 'quiz'].map((id) => [`tab-${id}`, { style: {} }]));
const buttons = ['learn', 'quiz'].map(() => ({
  states: new Set(),
  attrs: {},
  classList: { toggle(name, on) { on ? this.owner.states.add(name) : this.owner.states.delete(name); } },
  setAttribute(name, value) { this.attrs[name] = value; }
}));
for (const button of buttons) button.classList.owner = button;
const speechButton = {
  textContent: '', attrs: {}, states: new Set(),
  classList: { toggle(name, on) { on ? speechButton.states.add(name) : speechButton.states.delete(name); } },
  setAttribute(name, value) { this.attrs[name] = value; }
};
let spoken = 0;
const fakeSynth = {
  getVoices: () => [{ lang: 'zh-CN' }],
  addEventListener() {}, cancel() {},
  speak(utterance) { spoken++; queueMicrotask(() => utterance.onend()); }
};
class FakeUtterance { constructor(text) { this.text = text; } }
const fakeDocument = {
  getElementById(id) { return id === 'speakToggle' ? speechButton : panels[id] || null; },
  querySelectorAll() { return buttons; }
};
const fakeWindow = {
  speechSynthesis: fakeSynth,
  SpeechSynthesisUtterance: FakeUtterance,
  setTimeout, clearTimeout
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'hpx-core.js'), 'utf8'), {
  window: fakeWindow, document: fakeDocument, setTimeout, clearTimeout,
  Promise, Array, Object, String, Boolean, Math
});
fakeWindow.Hpx.tabs.activate('quiz', ['learn', 'quiz']);
if (panels['tab-learn'].style.display !== 'none' || panels['tab-quiz'].style.display !== '') {
  errors.push('hpx-core.js: Tab 面板切换运行时检查失败');
}
const speech = fakeWindow.Hpx.speech.create({ rate: 0.9 });
await speech.speak('测试');
await speech.sequence(['第一句', '第二句']);
const unlocked = speech.unlock('声音已解锁');
if (spoken !== 4 || unlocked !== true || speechButton.attrs['aria-pressed'] !== 'true' || speech.isAvailable() !== true) {
  errors.push('hpx-core.js: 语音控制器运行时检查失败');
}

if (sharedPageCount < 39) {
  errors.push(`共享层迁移页面数异常：期望至少 39，实际 ${sharedPageCount}`);
}
if (corePageCount < 56) {
  errors.push(`公共核心迁移页面数异常：期望至少 56，实际 ${corePageCount}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`共享层检查通过：${corePageCount} 个页面使用公共核心，${sharedPageCount} 个页面使用公共样式，${htmlFiles.length} 个 HTML 语法检查完成。`);
