import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const paradise=fs.readFileSync(new URL('game-paradise.html',root),'utf8');
const feedback=fs.readFileSync(new URL('feedback.js',root),'utf8');
const punctuation=fs.readFileSync(new URL('punctuation.html',root),'utf8');
const gameFiles=[...paradise.matchAll(/<a class="game-card" href="([^"]+\.html)"/g)].map(match=>match[1]);
const htmlFiles=fs.readdirSync(root,{withFileTypes:true})
  .filter(entry=>entry.isFile()&&entry.name.endsWith('.html'))
  .map(entry=>entry.name);
const loader='<script src="feedback.js?v=20260906-2"></script>';

assert.ok(gameFiles.length>=18,'游戏乐园中的游戏入口数量异常');
assert.equal(new Set(gameFiles).size,gameFiles.length,'游戏乐园存在重复游戏入口');

for(const file of htmlFiles){
  const html=fs.readFileSync(new URL(file,root),'utf8');
  assert.equal(html.split(loader).length-1,1,`${file}必须且只能加载一次当前版本的反馈浮窗`);
}

assert.ok(feedback.includes('id="fb-btn"'),'反馈组件缺少浮动入口按钮');
assert.ok(punctuation.includes(loader),'标点符号页面没有加载当前版本的反馈组件');
assert.ok(feedback.includes('role="dialog"'),'反馈组件缺少对话框语义');
assert.ok(feedback.includes('aria-keyshortcuts="Alt+Y"'),'反馈按钮没有声明 Option+Y 快捷键');
assert.ok(feedback.includes("button.addEventListener('click', openFeedback)"),'反馈按钮没有绑定打开事件');
assert.ok(feedback.includes("closeButton.addEventListener('click', closeFeedback)"),'反馈浮窗没有绑定关闭事件');
assert.ok(feedback.includes("event.key === 'Escape'"),'反馈浮窗不支持 Escape 关闭');
assert.ok(!feedback.includes('onclick='),'反馈组件不应依赖可能被页面安全策略阻止的内联事件');

class MockClassList{
  constructor(){this.values=new Set()}
  add(value){this.values.add(value)}
  remove(value){this.values.delete(value)}
  contains(value){return this.values.has(value)}
}
class MockElement{
  constructor(id){this.id=id;this.hidden=id==='fb-mask';this.attributes=new Map();this.classList=new MockClassList();this.listeners=new Map()}
  addEventListener(type,listener){this.listeners.set(type,listener)}
  setAttribute(name,value){this.attributes.set(name,String(value))}
  getAttribute(name){return this.attributes.get(name)}
  focus(){document.activeElement=this}
  fire(type,event={}){this.listeners.get(type)?.(event)}
}
const elements=new Map(),documentListeners=new Map();
const document={
  readyState:'complete',
  activeElement:null,
  head:{appendChild(){}},
  body:{insertAdjacentHTML(){for(const id of ['fb-btn','fb-mask','fb-card','fb-close'])elements.set(id,new MockElement(id))}},
  createElement(){return new MockElement('hpxPageSpeechScript')},
  getElementById(id){return elements.get(id)||null},
  addEventListener(type,listener){documentListeners.set(type,listener)}
};
vm.runInNewContext(feedback,{document},{filename:'feedback.js'});
const button=elements.get('fb-btn'),mask=elements.get('fb-mask'),close=elements.get('fb-close');
button.focus();button.fire('click');
assert.equal(mask.hidden,false,'点击反馈按钮后浮窗仍然隐藏');
assert.ok(mask.classList.contains('show'),'点击反馈按钮后缺少显示状态');
assert.equal(button.getAttribute('aria-expanded'),'true','反馈按钮没有同步展开状态');
close.fire('click');
assert.equal(mask.hidden,true,'点击关闭按钮后浮窗没有隐藏');
button.fire('click');mask.fire('click',{target:mask});
assert.equal(mask.hidden,true,'点击遮罩后浮窗没有关闭');
let shortcutPrevented=false;
documentListeners.get('keydown')({key:'¥',code:'KeyY',altKey:true,ctrlKey:false,metaKey:false,shiftKey:false,preventDefault(){shortcutPrevented=true}});
assert.equal(mask.hidden,false,'按 Option+Y 后反馈浮窗仍然隐藏');
assert.equal(shortcutPrevented,true,'Option+Y 没有阻止浏览器默认行为');
button.fire('click');documentListeners.get('keydown')({key:'Escape'});
assert.equal(mask.hidden,true,'按 Escape 后浮窗没有关闭');

console.log(`全站反馈检查通过：${htmlFiles.length}个网页均加载统一反馈浮窗，游戏乐园包含${gameFiles.length}个游戏入口。`);
