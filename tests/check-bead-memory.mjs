import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../bead-memory.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const home=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n<\/script>/);
assert.ok(match,'找不到闪记拼豆主脚本');
const script=match[0].replace(/\n<\/script>$/,'');

class MockElement{
  constructor(){this.dataset={};this.children=[];this.hidden=false;this.disabled=false;this.textContent='';this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}}}
  set innerHTML(value){this._innerHTML=value;if(value==='')this.children=[]}
  get innerHTML(){return this._innerHTML||''}
  addEventListener(){}
  appendChild(child){this.children.push(child);return child}
  setAttribute(){}
}
const elements=new Map();
const document={getElementById(id){if(!elements.has(id))elements.set(id,new MockElement());return elements.get(id)},createElement(){return new MockElement()},querySelectorAll(){return[]},addEventListener(){},body:new MockElement()};
const window={};
const context=vm.createContext({window,document,localStorage:{getItem(){return null},setItem(){}},matchMedia:()=>({matches:true}),setTimeout,clearTimeout,setInterval,clearInterval,Set,Math,console});
vm.runInContext(script,context,{filename:'bead-memory.html'});
const api=window.BeadMemory;
assert.ok(api,'闪记拼豆测试接口没有初始化');

function connected(cells,size){const filled=cells.map((value,index)=>value?index:-1).filter(index=>index>=0);if(!filled.length)return false;const seen=new Set([filled[0]]),queue=[filled[0]];while(queue.length){const index=queue.shift(),row=Math.floor(index/size),col=index%size;for(const [r,c] of [[row-1,col],[row+1,col],[row,col-1],[row,col+1]]){const next=r*size+c;if(r>=0&&r<size&&c>=0&&c<size&&cells[next]&&!seen.has(next)){seen.add(next);queue.push(next)}}}return seen.size===filled.length}

let generated=0;
for(const [level,cfg] of Object.entries(api.LEVELS)){
  for(let round=0;round<1000;round++){
    const pattern=api.generatePattern(level);generated++;
    assert.equal(pattern.size,cfg.size,`${level} 网格尺寸错误`);
    assert.equal(pattern.cells.length,cfg.size**2,`${level} 格子数量错误`);
    assert.equal(pattern.cells.filter(Boolean).length,cfg.filled,`${level} 彩豆数量错误`);
    assert.equal(new Set(pattern.cells.filter(Boolean)).size,cfg.colors,`${level} 没有使用规定的全部颜色`);
    assert.ok(pattern.cells.every(value=>value>=0&&value<=cfg.colors),`${level} 出现无效颜色编号`);
    assert.ok(connected(pattern.cells,cfg.size),`${level} 生成了不连通的图案`);
    const blank=Array(pattern.cells.length).fill(0),wrong=api.comparePattern(pattern.cells,blank),progress=api.countMatchedBeads(pattern.cells,blank);
    assert.equal(wrong.length,cfg.filled,`${level} 空白答案的差异数量错误`);
    assert.equal(JSON.stringify(progress),JSON.stringify({matched:0,total:cfg.filled}),`${level} 彩豆进度计算错误`);
    assert.equal(api.comparePattern(pattern.cells,pattern.cells.slice()).length,0,`${level} 完全复制后仍有差异`);
  }
}

assert.ok(paradise.includes('href="bead-memory.html"'),'游戏乐园缺少闪记拼豆入口');
assert.ok(paradise.includes('30 个游戏'),'游戏乐园数量没有更新为30');
assert.ok(home.includes('30个游戏集中选择'),'首页游戏乐园介绍数量没有更新为30');
assert.ok(html.indexOf('id="hideBtn"')>html.indexOf('<div class="actions">'),'手动结束观察按钮必须位于不会被隐藏的操作区');
assert.equal(document.getElementById('previewGrid').children.length,16,'默认4×4记忆图没有正确渲染');
assert.equal(document.getElementById('workGrid').children.length,16,'默认4×4还原区没有正确渲染');
console.log(`闪记拼豆检查通过：${generated}幅随机图案的尺寸、彩豆数、颜色数、连通性和答案比较全部正确。`);
