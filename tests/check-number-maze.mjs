import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../number-maze.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n<\/script>/);
assert.ok(match,'找不到数字迷宫主脚本');
const script=match[0].replace(/\n<\/script>$/,'');

class MockElement{
  constructor(){this.dataset={};this.children=[];this.hidden=false;this.disabled=false;this.textContent='';this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}}}
  set innerHTML(value){this._innerHTML=value;if(value==='')this.children=[]}
  get innerHTML(){return this._innerHTML||''}
  addEventListener(){}
  appendChild(child){this.children.push(child);return child}
  setAttribute(){}
  querySelector(){return new MockElement()}
}
const elements=new Map();
const document={getElementById(id){if(!elements.has(id))elements.set(id,new MockElement());return elements.get(id)},createElement(){return new MockElement()},querySelectorAll(){return[]},body:new MockElement()};
const window={Hpx:{speech:{create:()=>({speak(){},toggle(){}})}}};
const context=vm.createContext({window,document,Hpx:window.Hpx,localStorage:{getItem(){return null},setItem(){}},matchMedia:()=>({matches:true}),setTimeout,clearTimeout,Math,console});
vm.runInContext(script,context,{filename:'number-maze.html'});
const api=window.NumberMaze;
assert.ok(api,'数字迷宫测试接口没有初始化');
function calculate(label){const parts=label.split(/\s+/),left=Number(parts[0]),right=Number(parts[2]);if(parts[1]==='+')return left+right;if(parts[1]==='−')return left-right;if(parts[1]==='×')return left*right;if(parts[1]==='÷')return left/right;throw new Error(`未知运算符：${parts[1]}`)}

for(const level of Object.keys(api.LEVELS))for(let value=2;value<=96;value++)for(let i=0;i<20;i++){
  const expression=api.expressionForValue(value,level);
  assert.equal(expression.value,value,`${level} 算式记录的结果错误`);
  assert.equal(calculate(expression.label),value,`${level} 算式文本计算结果错误：${expression.label}`);
  assert.ok(/[+−×÷]/.test(expression.label),`${level} 生成了无运算符的算式`);
}

let generated=0;
for(const [level,cfg] of Object.entries(api.LEVELS)){
  for(let round=0;round<1000;round++){
    const game=api.createGame(level);generated++;
    assert.equal(game.rows.length,cfg.rows,`${level} 迷宫层数错误`);
    assert.equal(game.choices,cfg.choices,`${level} 每层门数错误`);
    for(const [index,row] of game.rows.entries()){
      assert.ok(row.target>=cfg.min&&row.target<=cfg.max,`${level} 第${index+1}层目标数越界`);
      assert.equal(row.options.length,cfg.choices,`${level} 第${index+1}层门数错误`);
      assert.equal(new Set(row.options.map(option=>option.value)).size,cfg.choices,`${level} 第${index+1}层出现相同结果的门`);
      assert.equal(row.options.filter(option=>option.value===row.target).length,1,`${level} 第${index+1}层正确门不是唯一`);
      assert.equal(row.options.find(option=>option.id===row.correctId).value,row.target,`${level} 第${index+1}层正确门编号错误`);
      const wrong=row.options.find(option=>option.id!==row.correctId);
      assert.equal(JSON.stringify(api.evaluateChoice(row,wrong.id,index)),JSON.stringify({correct:false,next:index}),`${level} 误选后离开了当前层`);
      assert.equal(JSON.stringify(api.evaluateChoice(row,row.correctId,index)),JSON.stringify({correct:true,next:index+1}),`${level} 正确选择后没有前进`);
    }
  }
}

assert.ok(paradise.includes('href="number-maze.html"'),'游戏乐园缺少数字迷宫入口');
assert.ok(document.getElementById('maze').children.length>0,'默认迷宫没有正确渲染');
console.log(`数字迷宫检查通过：${generated}个随机迷宫的层数、唯一正确门、算式范围和留步重试逻辑全部正确。`);
