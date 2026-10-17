import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../instruction-challenge.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n<\/script>/);
assert.ok(match,'找不到指令挑战主脚本');
const script=match[0].replace(/\n<\/script>$/,'');

class MockElement{
  constructor(){this.dataset={};this.children=[];this.hidden=false;this.disabled=false;this.textContent='';this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}}}
  set innerHTML(value){if(value==='')this.children=[]}
  get innerHTML(){return''}
  addEventListener(){}
  appendChild(child){this.children.push(child);return child}
  setAttribute(){}
  querySelector(){return new MockElement()}
}
const elements=new Map();
const document={getElementById(id){if(!elements.has(id))elements.set(id,new MockElement());return elements.get(id)},createElement(){return new MockElement()},querySelectorAll(){return[]},body:new MockElement()};
const window={Hpx:{speech:{create:()=>({speak(){},toggle(){}})}}};
const context=vm.createContext({window,document,Hpx:window.Hpx,localStorage:{getItem(){return null},setItem(){}},matchMedia:()=>({matches:true}),setTimeout,clearTimeout,Math,console});
vm.runInContext(script,context,{filename:'instruction-challenge.html'});
const api=window.InstructionChallenge;
assert.ok(api,'指令挑战测试接口没有初始化');

let generated=0;
for(const [level,cfg] of Object.entries(api.LEVELS)){
  for(let round=0;round<1000;round++){
    const game=api.createGame(level);generated++;
    assert.equal(game.cards.length,cfg.count,`${level} 卡片数量错误`);
    assert.equal(game.steps.length,cfg.steps,`${level} 指令步骤数量错误`);
    assert.equal(new Set(game.cards.map(card=>card.id)).size,cfg.count,`${level} 出现重复卡片编号`);
    assert.equal(new Set(game.cards.map(card=>card.number)).size,cfg.count,`${level} 出现重复数字`);
    assert.equal(new Set(game.steps.map(step=>step.targetId)).size,cfg.steps,`${level} 多个步骤选择了同一目标`);
    for(const [index,step] of game.steps.entries()){
      const target=game.cards.find(card=>card.id===step.targetId);
      const matches=game.cards.filter(card=>api.matchesFields(card,step.fields,target));
      assert.equal(matches.length,1,`${level} 第${index+1}步不能唯一确定目标`);
      assert.equal(matches[0].id,step.targetId,`${level} 第${index+1}步匹配到错误目标`);
      assert.ok(step.text.startsWith('点'),`${level} 第${index+1}步缺少动作词“点”`);
      const wrong=game.cards.find(card=>card.id!==step.targetId);
      assert.equal(JSON.stringify(api.evaluateStep(step,wrong.id,index)),JSON.stringify({correct:false,next:index}),`${level} 误点后跳过了当前步骤`);
      assert.equal(JSON.stringify(api.evaluateStep(step,step.targetId,index)),JSON.stringify({correct:true,next:index+1}),`${level} 正确点击后没有进入下一步`);
    }
    const text=api.commandText(game.steps);
    assert.ok(text.startsWith('先点')&&text.endsWith('。'),`${level} 完整指令缺少动作、顺序提示或句号`);
  }
}

assert.equal(document.getElementById('board').children.length,6,'默认低年级卡片没有正确渲染');
assert.ok(paradise.includes('href="instruction-challenge.html"'),'游戏乐园缺少指令挑战入口');
console.log(`指令挑战检查通过：${generated}组随机题的卡片、步骤、唯一匹配和误点保留逻辑全部正确。`);
