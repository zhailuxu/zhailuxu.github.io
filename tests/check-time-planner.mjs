import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../time-planner.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const roadmap=fs.readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n\}\)\(\);/);
assert.ok(match,'找不到时间规划站主脚本');
const window={};
vm.runInContext(match[0],vm.createContext({window,Math,console}),{filename:'time-planner.html'});
const api=window.TimePlanner;
assert.ok(api,'时间规划站测试接口没有初始化');
assert.equal(api.formatTime(0),'00:00','零点格式错误');
assert.equal(api.formatTime(13*60+5),'13:05','时间补零格式错误');
assert.equal(api.overlap(600,660,660,720),false,'首尾相接不应算冲突');
assert.equal(api.overlap(600,661,660,720),true,'重叠一分钟没有识别');

let generated=0;
for(const [level,cfg] of Object.entries(api.CONFIG))for(let i=0;i<1000;i++){
  const problem=api.generateProblem(level);generated++;
  assert.equal(problem.type,cfg.type,`${level}题型错误`);
  assert.equal(problem.options.length,3,`${level}选项数量错误`);
  assert.equal(new Set(problem.options).size,3,`${level}选项重复`);
  assert.ok(problem.options.includes(problem.correct),`${level}正确答案不在选项中`);
  if(level==='easy'){
    const source=api.LIFE_TASKS.find(task=>task.name===problem.task.name);
    assert.ok(problem.correct>=source.good[0]&&problem.correct<=source.good[1],'合适时刻超出任务时段');
  }else if(level==='medium'){
    assert.equal(problem.correct,problem.start+problem.duration,'经过时间计算错误');
  }else{
    assert.equal(api.isValidStart(problem.correct,problem.duration,problem.events,problem.windowStart,problem.windowEnd),true,'正确空档发生冲突');
    for(const option of problem.options.filter(value=>value!==problem.correct))assert.equal(api.isValidStart(option,problem.duration,problem.events,problem.windowStart,problem.windowEnd),false,'困难题出现多个可行空档');
  }
}

assert.ok(html.includes('data-sound-standard="speech"'),'缺少声音能力标记');
assert.ok(html.includes('href="hpx-game-mobile.css"'),'没有接入移动端公共层');
assert.ok(html.includes('<script src="hpx-game-progress.js"></script>'),'没有接入成长记录');
assert.ok(paradise.includes('href="time-planner.html"'),'游戏乐园缺少时间规划站入口');
assert.ok(paradise.includes('30 个游戏'),'游戏乐园数量没有更新为30');
assert.ok(roadmap.includes('**时间规划站（第一版）**'),'路线图没有标记时间规划站完成');
assert.ok(sources.includes('`time-planner.html` 时间规划站'),'内容来源没有登记时间规划站');
console.log(`时间规划站检查通过：${generated}道随机生活时刻、经过时间和日程冲突题均有效。`);
