import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const js=fs.readFileSync(new URL('hpx-accessibility.js',root),'utf8');
const css=fs.readFileSync(new URL('hpx-accessibility.css',root),'utf8');
const core=fs.readFileSync(new URL('hpx-core.js',root),'utf8');
const progress=fs.readFileSync(new URL('hpx-game-progress.js',root),'utf8');
const roadmap=fs.readFileSync(new URL('ROADMAP.md',root),'utf8');
const sources=fs.readFileSync(new URL('CONTENT_SOURCES.md',root),'utf8');

assert.ok(js.includes("link.textContent='跳到主要内容'"),'缺少跳过导航入口');
assert.ok(js.includes("closest('[role=\"button\"]')"),'缺少自定义按钮键盘代理');
assert.ok(js.includes("event.key==='Enter'||event.key===' '"),'自定义按钮没有同时支持回车和空格');
assert.ok(js.includes("setAttribute('aria-live','polite')"),'动态反馈缺少礼貌播报');
assert.ok(js.includes("setAttribute('aria-atomic','true')"),'动态反馈缺少完整播报');
assert.ok(js.includes('MutationObserver'),'动态创建内容没有持续增强');
assert.ok(css.includes(':focus-visible'),'公共层缺少清晰键盘焦点');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'公共层没有响应减少动画');
assert.ok(css.includes('@media(prefers-contrast:more)'),'公共层没有响应增强对比度');
assert.ok(css.includes('@media(forced-colors:active)'),'公共层没有兼容强制色彩模式');
assert.ok(core.includes("script.src = 'hpx-accessibility.js'"),'公共核心没有加载无障碍层');
assert.ok(progress.includes("a11yScript.src='hpx-accessibility.js'"),'30个游戏共用层没有加载无障碍脚本');
assert.ok(roadmap.includes('**无障碍与低视力公共层（第一版）**'),'路线图没有标记无障碍专项完成');
assert.ok(sources.includes('`hpx-accessibility.js` / `hpx-accessibility.css` 无障碍公共层'),'内容来源没有登记无障碍公共层');

const listeners={};
const main={id:'',tagName:'MAIN',attrs:new Map(),hasAttribute(name){return this.attrs.has(name)},setAttribute(name,value){this.attrs.set(name,value)}};
const status={attrs:new Map(),matches(selector){return selector.includes('.message')},querySelectorAll(){return[]},hasAttribute(name){return this.attrs.has(name)},setAttribute(name,value){this.attrs.set(name,value)}};
const body={firstChild:null,insertBefore(){},querySelectorAll(){return[]}};
const document={readyState:'complete',head:{appendChild(){}},body,createElement(tag){return{tagName:tag.toUpperCase(),set id(value){this._id=value},get id(){return this._id}}},getElementById(){return null},querySelector(selector){if(selector==='main')return main;return null},querySelectorAll(){return[]},addEventListener(type,handler){listeners[type]=handler}};
class Observer{observe(){}}
const context={window:{},document,MutationObserver:Observer};context.window.window=context.window;context.window.document=document;context.window.MutationObserver=Observer;
vm.runInContext(js,vm.createContext(context),{filename:'hpx-accessibility.js'});
context.window.HpxAccessibility.enhance(status);
assert.equal(status.attrs.get('role'),'status','反馈元素没有补充status角色');
assert.equal(status.attrs.get('aria-live'),'polite','反馈元素没有补充aria-live');
assert.equal(status.attrs.get('aria-atomic'),'true','反馈元素没有补充aria-atomic');
console.log('无障碍检查通过：跳过导航、键盘激活、状态播报、焦点、减少动画、高对比度与强制色彩模式完整。');
