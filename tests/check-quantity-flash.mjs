import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../quantity-flash.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const roadmap=fs.readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n\}\)\(\);/);
assert.ok(match,'找不到数量闪视主脚本');

class MockElement{constructor(){this.hidden=false;this.disabled=false;this.textContent='';this.innerHTML='';this.dataset={};this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}}}addEventListener(){}querySelectorAll(){return[]}setAttribute(){}}
const elements=new Map(),document={getElementById(id){if(!elements.has(id))elements.set(id,new MockElement());return elements.get(id)},querySelectorAll(){return[]},createElement(){return new MockElement()},body:new MockElement()};
const window={};
vm.runInContext(match[0],vm.createContext({window,document,localStorage:{getItem(){return null},setItem(){}},matchMedia:()=>({matches:true}),setTimeout(){return 1},clearTimeout(){},Math,console}),{filename:'quantity-flash.html'});
const api=window.QuantityFlash;
assert.ok(api,'数量闪视测试接口没有初始化');

let generated=0;
for(const [level,cfg] of Object.entries(api.LEVELS)){
  for(let i=0;i<1000;i++){
    const round=api.generateRound(level);generated++;
    assert.ok(round.count>=cfg.min&&round.count<=cfg.max,`${level} 数量超出范围`);
    assert.equal(round.cells.length,round.count,`${level} 圆点数量和答案不一致`);
    assert.equal(new Set(round.cells).size,round.cells.length,`${level} 圆点位置重复`);
    assert.ok(round.cells.every(cell=>cell>=0&&cell<cfg.rows*cfg.cols),`${level} 圆点位置越界`);
    assert.equal(round.options.length,4,`${level} 答案选项不足4个`);
    assert.equal(new Set(round.options).size,4,`${level} 答案选项重复`);
    assert.ok(round.options.includes(round.count),`${level} 选项缺少正确数量`);
    assert.equal(api.evaluateAnswer(round,round.count),true,`${level} 正确答案被拒绝`);
    const wrong=round.options.find(value=>value!==round.count);
    assert.equal(api.evaluateAnswer(round,wrong),false,`${level} 错误答案被接受`);
    if(level==='easy')assert.equal(JSON.stringify(round.cells),JSON.stringify(api.EASY_PATTERNS[round.count]),`低年级${round.count}点没有使用整体形状模式`);
    if(level==='medium')assert.ok(round.cells.slice(0,5).every((cell,index)=>cell===index),'中年级没有优先组成5个一组');
  }
}
assert.ok(paradise.includes('href="quantity-flash.html"'),'游戏乐园缺少数量闪视入口');
assert.ok(paradise.includes('30 个游戏'),'游戏乐园数量没有同步最新游戏总数');
assert.ok(roadmap.includes('**数量闪视（第一版）**'),'路线图缺少数量闪视完成记录');
assert.ok(roadmap.includes('**规则切换分类站（第一版）**'),'下一项规则切换分类站没有完成');
assert.ok(sources.includes('`quantity-flash.html` 数量闪视'),'内容来源未登记数量闪视');
assert.ok(html.includes('data-sound-standard="speech"'),'数量闪视缺少声音能力标记');
assert.ok(html.includes('<script src="hpx-core.js"></script>'),'数量闪视没有接入公共语音层');
assert.ok(html.includes('id="speakToggle"'),'数量闪视缺少声音开关');
assert.ok(html.includes("say('圆点藏好了。你看到了多少个圆点？')"),'数量隐藏后没有朗读问题');
assert.ok(html.includes("say('这个数量不对。可以再选一次，或者再看一次。')"),'数量选错后没有语音反馈');
console.log(`数量闪视检查通过：${generated}组随机题的数量、圆点位置、分组布局和答案选项全部正确。`);
