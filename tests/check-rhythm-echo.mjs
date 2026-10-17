import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../rhythm-echo.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const roadmap=fs.readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n\}\)\(\);/);
assert.ok(match,'找不到节奏回声主脚本');

class MockElement{constructor(){this.hidden=false;this.disabled=false;this.textContent='';this.innerHTML='';this.dataset={};this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}}}addEventListener(){}querySelector(){return new MockElement()}querySelectorAll(){return[]}setAttribute(){}}
const elements=new Map(),document={getElementById(id){if(!elements.has(id))elements.set(id,new MockElement());return elements.get(id)},querySelectorAll(){return[]},addEventListener(){},body:new MockElement()};
const window={};
vm.runInContext(match[0],vm.createContext({window,document,localStorage:{getItem(){return null},setItem(){}},matchMedia:()=>({matches:true}),setTimeout(){return 1},clearTimeout(){},Math,console}),{filename:'rhythm-echo.html'});
const api=window.RhythmEcho;
assert.ok(api,'节奏回声测试接口没有初始化');

let generated=0;
for(const [level,cfg] of Object.entries(api.LEVELS)){
  for(let i=0;i<1000;i++){
    const sequence=api.createSequence(level);generated++;
    assert.equal(sequence.length,cfg.length,`${level} 节奏长度错误`);
    assert.ok(sequence.every(value=>Number.isInteger(value)&&value>=0&&value<cfg.pads),`${level} 出现无效音垫`);
    for(let j=2;j<sequence.length;j++)assert.ok(!(sequence[j]===sequence[j-1]&&sequence[j]===sequence[j-2]),`${level} 出现连续三个相同节拍`);
    if(level==='hard'){
      assert.ok(sequence.includes(4),'高年级缺少停顿拍');
      assert.notEqual(sequence[0],4,'高年级第一拍不应是停顿');
      assert.notEqual(sequence.at(-1),4,'高年级最后一拍不应是停顿');
      for(let j=1;j<sequence.length;j++)assert.ok(!(sequence[j]===4&&sequence[j-1]===4),'高年级出现连续停顿');
    }
    let input=[];
    for(const value of sequence){const result=api.judgeInput(sequence,input,value);assert.equal(result.correct,true,`${level} 正确节拍被拒绝`);input=result.next}
    assert.equal(input.length,sequence.length,`${level} 无法完整复现`);
    const wrong=(sequence[0]+1)%cfg.pads,result=api.judgeInput(sequence,[],wrong);
    if(wrong!==sequence[0])assert.equal(result.correct,false,`${level} 错误首拍被接受`);
  }
}
assert.ok(paradise.includes('href="rhythm-echo.html"'),'游戏乐园缺少节奏回声入口');
assert.ok(paradise.includes('30 个游戏'),'游戏乐园数量没有同步最新游戏总数');
assert.ok(roadmap.includes('**节奏回声（第一版）**'),'路线图缺少节奏回声完成记录');
assert.ok(sources.includes('`rhythm-echo.html` 节奏回声'),'内容来源未登记节奏回声');
assert.ok(html.includes('window.AudioContext||window.webkitAudioContext'),'节奏声音没有使用浏览器现场合成');
assert.ok(!/\.(mp3|wav|ogg|m4a)/i.test(html),'页面不应引入外部音频文件');
console.log(`节奏回声检查通过：${generated}组随机节奏的长度、音垫范围、停顿规则和完整复现全部正确。`);
