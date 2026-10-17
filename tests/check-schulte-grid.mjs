import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../schulte-grid.html',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n<\/script>/);
assert.ok(match,'找不到舒尔特方格主脚本');
const script=match[0].replace(/\n<\/script>$/,'');

class MockElement{
  constructor(){
    this.dataset={};this.children=[];this.hidden=false;this.disabled=false;this.textContent='';
    this.style={setProperty(){}};
    this.classList={add(){},remove(){},toggle(){}};
  }
  set innerHTML(value){if(value==='')this.children=[]}
  get innerHTML(){return''}
  addEventListener(){}
  appendChild(child){this.children.push(child);return child}
  setAttribute(){}
  querySelector(){return new MockElement()}
}

const elements=new Map();
const document={
  getElementById(id){if(!elements.has(id))elements.set(id,new MockElement());return elements.get(id)},
  createElement(){return new MockElement()},
  querySelectorAll(){return[]},
  body:new MockElement()
};
const window={Hpx:{speech:{create:()=>({speak(){},toggle(){}})}}};
const context=vm.createContext({
  window,document,Hpx:window.Hpx,
  localStorage:{getItem(){return null},setItem(){}},
  matchMedia:()=>({matches:true}),setTimeout,clearTimeout,setInterval,clearInterval,
  performance:{now:()=>0},Math,console
});
vm.runInContext(script,context,{filename:'schulte-grid.html'});
const api=window.SchulteGrid;
assert.ok(api,'舒尔特方格测试接口没有初始化');

assert.equal(api.chineseNumber(1),'一');
assert.equal(api.chineseNumber(10),'十');
assert.equal(api.chineseNumber(11),'十一');
assert.equal(api.chineseNumber(20),'二十');
assert.equal(api.chineseNumber(25),'二十五');
assert.equal(JSON.stringify(api.checkPick([1,2,3],0,2)),JSON.stringify({correct:false,next:0}),'误点后不应跳过当前目标');
assert.equal(JSON.stringify(api.checkPick([1,2,3],0,1)),JSON.stringify({correct:true,next:1}),'正确点击后应进入下一目标');

const types=['number','reverse','letter','chinese'];
let generated=0;
for(const [level,cfg] of Object.entries(api.LEVELS)){
  const count=cfg.size**2;
  for(const type of types){
    for(let round=0;round<250;round++){
      const game=api.createGame(level,type);generated++;
      assert.equal(game.size,cfg.size,`${level} 网格尺寸错误`);
      assert.equal(game.cells.length,count,`${level}/${type} 格子数量错误`);
      assert.equal(new Set(game.cells.map(cell=>cell.value)).size,count,`${level}/${type} 出现重复格子`);
      assert.deepEqual([...game.cells.map(cell=>cell.value)].sort((a,b)=>a-b),Array.from({length:count},(_,i)=>i+1),`${level}/${type} 数值范围错误`);
      const expectedOrder=Array.from({length:count},(_,i)=>type==='reverse'?count-i:i+1);
      assert.deepEqual(Array.from(game.order),expectedOrder,`${level}/${type} 点击顺序错误`);
      assert.deepEqual(Array.from(game.labels),expectedOrder.map(value=>api.labelFor(value,type)),`${level}/${type} 标签顺序错误`);
      for(const cell of game.cells)assert.equal(cell.label,api.labelFor(cell.value,type),`${level}/${type} 格子标签错误`);
    }
  }
}

assert.equal(document.getElementById('grid').children.length,9,'默认3×3方格没有正确渲染');
assert.equal(document.getElementById('cover').hidden,false,'准备阶段不应提前显示方格');
console.log(`舒尔特方格检查通过：中文数字转换正确，${generated}组随机方格均符合尺寸、唯一性和点击顺序规则。`);
