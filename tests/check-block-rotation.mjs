import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../block-rotation.html', import.meta.url), 'utf8');
const match = html.match(/\(function\(\)\{[\s\S]*?\n\}\)\(\);/);
assert.ok(match, '找不到方块旋转主脚本');

class MockElement {
  constructor() { this.dataset={};this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}};this.children=[];this.hidden=false;this.disabled=false; }
  addEventListener() {} appendChild(child){this.children.push(child);return child} setAttribute() {}
}
const elements=new Map();
const document={getElementById(id){if(!elements.has(id))elements.set(id,new MockElement());return elements.get(id)},createElement(){return new MockElement()},querySelectorAll(){return[]},body:new MockElement()};
const window={Hpx:{speech:{create:()=>({speak(){},toggle(){}})}}};
const context=vm.createContext({window,document,Hpx:window.Hpx,localStorage:{getItem(){return null},setItem(){}},matchMedia:()=>({matches:true}),setTimeout,clearTimeout,Math,console});
vm.runInContext(match[0],context,{filename:'block-rotation.html'});
const api=window.BlockRotation;
assert.ok(api,'方块旋转测试接口没有初始化');

const sample=[1,2,3,4];
assert.equal(JSON.stringify(api.rotateGrid(sample,2,1)),JSON.stringify([3,1,4,2]),'顺时针90°映射错误');
assert.equal(JSON.stringify(api.rotateGrid(sample,2,2)),JSON.stringify([4,3,2,1]),'顺时针180°映射错误');
assert.equal(JSON.stringify(api.rotateGrid(sample,2,4)),JSON.stringify(sample),'旋转360°没有回到原图');

for(const [level,config] of Object.entries(api.LEVELS)){
  for(let round=0;round<1000;round++){
    const q=api.createQuestion(level),correctKey=api.gridKey(q.correct),keys=q.choices.map(api.gridKey);
    assert.equal(q.base.length,config.size**2,`${level} 原图尺寸错误`);
    assert.ok(config.turns.includes(q.turns),`${level} 使用了未配置的旋转角度`);
    assert.equal(api.gridKey(api.rotateGrid(q.base,q.size,q.turns)),correctKey,`${level} 正确答案与旋转结果不一致`);
    assert.equal(q.choices.length,config.choices,`${level} 选项数量错误`);
    assert.equal(new Set(keys).size,config.choices,`${level} 出现重复选项`);
    assert.equal(keys.filter(key=>key===correctKey).length,1,`${level} 正确答案不是唯一选项`);
  }
}
assert.equal(document.getElementById('options').children.length,3,'默认低年级选项没有正确渲染');
console.log('方块旋转检查通过：旋转映射正确，3000道随机题目的选项唯一且答案有效。');
