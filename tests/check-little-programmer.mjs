import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../little-programmer.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const roadmap=fs.readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n\}\)\(\);/);
assert.ok(match,'找不到小小程序员主脚本');

class MockElement{constructor(){this.hidden=false;this.disabled=false;this.textContent='';this.innerHTML='';this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}}}addEventListener(){}appendChild(){}querySelectorAll(){return[]}setAttribute(){}}
const elements=new Map(),document={getElementById(id){if(!elements.has(id))elements.set(id,new MockElement());return elements.get(id)},querySelector(){return new MockElement()},querySelectorAll(){return[]},createElement(){return new MockElement()},body:new MockElement()};
const window={};
const context=vm.createContext({window,document,localStorage:{getItem(){return null},setItem(){}},matchMedia:()=>({matches:true}),setTimeout(){return 1},clearTimeout(){},Math,console});
vm.runInContext(match[0],context,{filename:'little-programmer.html'});
const api=window.LittleProgrammer;
assert.ok(api,'小小程序员测试接口没有初始化');
assert.deepEqual(JSON.parse(JSON.stringify([0,1,2,3].map(api.directionInfo))),[{name:'上方',arrow:'↑'},{name:'右方',arrow:'→'},{name:'下方',arrow:'↓'},{name:'左方',arrow:'←'}],'四个方向的文字和箭头映射错误');
assert.ok(html.includes('id="directionText"'),'页面缺少醒目的当前朝向提示');
assert.ok(html.includes('机器人身体里的白色箭头'),'玩法说明没有解释双重朝向提示');
assert.ok(html.includes('<script src="hpx-core.js"></script>'),'小小程序员没有接入公共语音层');
assert.ok(html.includes('id="speakToggle"'),'小小程序员缺少声音开关');
assert.ok(html.includes("speech.speak(text)"),'小小程序员缺少浏览器语音解说调用');
assert.ok(html.includes('id="previewToggle"'),'小小程序员缺少指令预演开关');
assert.ok(html.includes('function previewCommand(command)'),'小小程序员缺少单块指令预演逻辑');
assert.ok(html.includes('if(state.preview)syncPreview()'),'撤销指令后没有同步预演位置');
assert.ok(html.indexOf('data-command="left"')<html.indexOf('data-command="forward"')&&html.indexOf('data-command="forward"')<html.indexOf('data-command="right"'),'基础指令按钮必须按左转、前进、右转排列');

let generated=0;
for(const [level,cfg] of Object.entries(api.LEVELS)){
  for(let i=0;i<1000;i++){
    const puzzle=api.generatePuzzle(level);generated++;
    assert.equal(puzzle.size,cfg.size,`${level} 网格尺寸错误`);
    assert.ok(puzzle.path.length>=cfg.pathMin&&puzzle.path.length<=cfg.pathMax,`${level} 路线长度错误`);
    const pathKeys=new Set(puzzle.path.map(pos=>`${pos.r},${pos.c}`));
    assert.equal(pathKeys.size,puzzle.path.length,`${level} 路线出现重复格`);
    puzzle.path.slice(1).forEach((pos,index)=>assert.equal(Math.abs(pos.r-puzzle.path[index].r)+Math.abs(pos.c-puzzle.path[index].c),1,`${level} 路线出现非相邻移动`));
    puzzle.walls.forEach(pos=>assert.ok(!pathKeys.has(`${pos.r},${pos.c}`),`${level} 障碍压住参考路线`));
    assert.ok(puzzle.solution.length<=puzzle.maxBlocks,`${level} 参考程序超过积木上限`);
    const result=api.simulate(puzzle,puzzle.solution);
    assert.equal(result.robot.crash,false,`${level} 参考程序发生碰撞`);
    assert.equal(result.reached,true,`${level} 参考程序未到终点`);
    if(level==='hard')assert.ok(puzzle.solution.every(command=>['forward','left','right','forward2','forward3'].includes(command)),'高年级出现无效重复指令');
  }
}
assert.ok(paradise.includes('href="little-programmer.html"'),'游戏乐园缺少小小程序员入口');
assert.ok(paradise.includes('30 个游戏'),'游戏乐园数量没有同步最新游戏总数');
assert.ok(roadmap.includes('**小小程序员（第一版）**'),'路线图缺少小小程序员完成记录');
assert.ok(roadmap.includes('**图形装箱（第一版）**'),'图形装箱没有完成');
assert.ok(sources.includes('`little-programmer.html` 小小程序员'),'内容来源未登记小小程序员');
console.log(`小小程序员检查通过：${generated}张随机地图的路线、障碍、参考程序和终点执行全部正确。`);
