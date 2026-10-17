import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../reaction-control.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n<\/script>/);
assert.ok(match,'找不到反应控制主脚本');
const script=match[0].replace(/\n<\/script>$/,'');

class MockElement{
  constructor(){this.dataset={};this.children=[];this.hidden=false;this.disabled=false;this.textContent='';this.listeners={};this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}}}
  set innerHTML(value){this._innerHTML=value;if(value==='')this.children=[]}
  get innerHTML(){return this._innerHTML||''}
  addEventListener(type,listener){this.listeners[type]=listener}
  click(){this.listeners.click?.({target:this})}
  appendChild(child){this.children.push(child);return child}
  setAttribute(){}
}
const elements=new Map();
const document={getElementById(id){if(!elements.has(id))elements.set(id,new MockElement());return elements.get(id)},createElement(){return new MockElement()},querySelectorAll(){return[]},body:new MockElement()};
const window={Hpx:{speech:{create:()=>({speak(){},toggle(){}})}}};
const context=vm.createContext({window,document,Hpx:window.Hpx,localStorage:{getItem(){return null},setItem(){}},matchMedia:()=>({matches:true}),setTimeout(callback){callback();return 1},clearTimeout(){},performance:{now:()=>0},Math,console});
vm.runInContext(script,context,{filename:'reaction-control.html'});
const api=window.ReactionControl;
assert.ok(api,'反应控制测试接口没有初始化');

assert.equal(JSON.stringify(api.judgeTrial({shouldTap:true},true)),JSON.stringify({correct:true,error:null}),'该点时点击应判定正确');
assert.equal(JSON.stringify(api.judgeTrial({shouldTap:false},false)),JSON.stringify({correct:true,error:null}),'该等时等待应判定正确');
assert.equal(JSON.stringify(api.judgeTrial({shouldTap:false},true)),JSON.stringify({correct:false,error:'falseTap'}),'误点类型错误');
assert.equal(JSON.stringify(api.judgeTrial({shouldTap:true},false)),JSON.stringify({correct:false,error:'miss'}),'漏点类型错误');

let generated=0;
for(const [level,cfg] of Object.entries(api.LEVELS)){
  for(let round=0;round<1000;round++){
    const game=api.createGame(level);generated++;
    assert.equal(game.trials.length,cfg.count,`${level} 刺激数量错误`);
    assert.equal(game.duration,cfg.duration,`${level} 显示时长错误`);
    const taps=game.trials.filter(trial=>trial.shouldTap).length;
    assert.equal(taps,Math.ceil(cfg.count/2),`${level} 点击/等待题目比例不平衡`);
    for(const [index,trial] of game.trials.entries()){
      assert.ok(['color','shape'].includes(trial.rule),`${level} 出现无效规则`);
      if(trial.rule==='color')assert.equal(trial.colorKey==='green',trial.shouldTap,`${level} 颜色规则生成错误`);
      if(trial.rule==='shape')assert.equal(trial.shapeKey==='circle',trial.shouldTap,`${level} 形状规则生成错误`);
      if(level==='hard')assert.equal(trial.rule,Math.floor(index/4)%2===0?'color':'shape',`高年级第${index+1}题没有按4题切换规则`);
    }
  }
}

assert.ok(paradise.includes('href="reaction-control.html"'),'游戏乐园缺少反应控制入口');
assert.equal(document.getElementById('cover').hidden,false,'页面初始化后应停留在准备状态');
assert.equal(document.getElementById('startBtn').hidden,false,'准备状态应显示开始本轮');
assert.equal(document.getElementById('nextBtn').hidden,true,'准备状态不应显示下一组');
document.getElementById('startBtn').click();
assert.equal(document.getElementById('startBtn').hidden,true,'本轮完成后应隐藏无效的开始本轮按钮');
assert.equal(document.getElementById('nextBtn').hidden,false,'本轮完成后应显示下一组按钮');
document.getElementById('nextBtn').click();
assert.equal(document.getElementById('startBtn').hidden,false,'进入下一组准备状态后应恢复开始本轮按钮');
assert.equal(document.getElementById('nextBtn').hidden,true,'进入下一组准备状态后应隐藏下一组按钮');
console.log(`反应控制检查通过：${generated}组随机题的规则与判定正确，完成和下一组的按钮状态切换正常。`);
