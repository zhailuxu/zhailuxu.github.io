import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../hanzi-components.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n<\/script>/);
assert.ok(match,'找不到汉字部件拼装主脚本');
const script=match[0].replace(/\n<\/script>$/,'');

class MockElement{
  constructor(){this.dataset={};this.children=[];this.hidden=false;this.disabled=false;this.textContent='';this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}}}
  set innerHTML(value){this._innerHTML=value;if(value==='')this.children=[]}
  get innerHTML(){return this._innerHTML||''}
  addEventListener(){}
  appendChild(child){this.children.push(child);return child}
  setAttribute(){}
  querySelectorAll(){return[]}
}
const elements=new Map();
const document={getElementById(id){if(!elements.has(id))elements.set(id,new MockElement());return elements.get(id)},createElement(){return new MockElement()},querySelectorAll(){return[]},body:new MockElement()};
const window={Hpx:{speech:{create:()=>({speak(){},toggle(){}})}}};
const context=vm.createContext({window,document,Hpx:window.Hpx,localStorage:{getItem(){return null},setItem(){}},matchMedia:()=>({matches:true}),setTimeout,clearTimeout,Math,console});
vm.runInContext(script,context,{filename:'hanzi-components.html'});
const api=window.HanziComponents;
assert.ok(api,'汉字部件拼装测试接口没有初始化');

const knownLayouts=new Set(['lr','tb','surround','lr3','top2bottom','triangle']);
const allQuestions=Object.values(api.QUESTIONS).flat();
assert.equal(new Set(allQuestions.map(question=>question.char)).size,allQuestions.length,'题库出现重复汉字');
for(const question of allQuestions){
  assert.ok(question.char&&question.pinyin&&question.meaning&&question.structure,'题目缺少汉字、拼音、含义或结构');
  assert.ok(knownLayouts.has(question.layout),`${question.char} 使用未知结构布局`);
  assert.ok(question.parts.length===2||question.parts.length===3,`${question.char} 部件数量不是2或3`);
}

let generated=0;
for(const [level,cfg] of Object.entries(api.LEVELS)){
  for(let round=0;round<1000;round++){
    const game=api.createGame(level);generated++;
    assert.ok(api.QUESTIONS[level].some(question=>question.char===game.question.char),`${level} 抽到了其他难度的汉字`);
    assert.equal(game.bank.length,cfg.options,`${level} 候选部件数量错误`);
    assert.equal(new Set(game.bank.map(token=>token.id)).size,cfg.options,`${level} 候选部件编号重复`);
    const solutionCounts=new Map();for(const part of game.question.parts)solutionCounts.set(part,(solutionCounts.get(part)||0)+1);
    for(const [part,count] of solutionCounts)assert.equal(game.bank.filter(token=>token.correct&&token.text===part).length,count,`${game.question.char} 缺少正确部件“${part}”`);
    assert.ok(game.bank.filter(token=>!token.correct).every(token=>!game.question.parts.includes(token.text)),`${game.question.char} 干扰项意外成为正确部件`);
    game.question.parts.forEach((part,index)=>assert.equal(JSON.stringify(api.evaluatePick(game.question.parts,index,part)),JSON.stringify({correct:true,next:index+1}),`${game.question.char} 正确部件没有推进槽位`));
    const wrong=game.bank.find(token=>!token.correct);
    assert.equal(JSON.stringify(api.evaluatePick(game.question.parts,0,wrong.text)),JSON.stringify({correct:false,next:0}),`${game.question.char} 误选后占用了槽位`);
  }
}

assert.ok(paradise.includes('href="hanzi-components.html"'),'游戏乐园缺少汉字部件拼装入口');
assert.equal(document.getElementById('assembly').children.length,2,'默认汉字的两个部件槽没有正确渲染');
console.log(`汉字部件拼装检查通过：${allQuestions.length}个汉字资料完整，${generated}组随机题的部件数量、干扰项和留槽重试逻辑全部正确。`);
