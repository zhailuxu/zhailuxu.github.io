import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../probability-lab.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const roadmap=fs.readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n\}\)\(\);/);
assert.ok(match,'找不到概率实验室主脚本');
const window={};
vm.runInContext(match[0],vm.createContext({window,Math,console}),{filename:'probability-lab.html'});
const api=window.ProbabilityLab;
assert.ok(api,'概率实验室测试接口没有初始化');

assert.deepEqual(Array.from({length:11},(_,i)=>api.diceWays(i+2)),[1,2,3,4,5,6,5,4,3,2,1],'双骰点数和组合数错误');
let generated=0;
for(const [level,cfg] of Object.entries(api.CONFIG))for(let i=0;i<1000;i++){
  const exp=api.generateExperiment(level);generated++;
  assert.equal(exp.type,cfg.type,`${level}实验类型错误`);
  assert.ok(exp.options.map(String).includes(String(exp.correct)),`${level}正确预测不在选项中`);
  const probabilities=api.probabilityMap(exp),sum=Object.values(probabilities).reduce((a,b)=>a+b,0);
  assert.ok(Math.abs(sum-1)<1e-10,`${level}理论概率之和不是1`);
  const result=api.runTrials(exp,100);
  assert.equal(Object.values(result.counts).reduce((a,b)=>a+b,0),100,`${level}实验次数统计错误`);
  assert.ok(exp.outcomes.includes(result.last),`${level}产生了装置范围外的结果`);
  if(level==='easy'){
    const p=probabilities[exp.target],expected=p===1?'一定':p===0?'不可能':'可能';
    assert.equal(exp.correct,expected,'彩球事件分类与球数不一致');
  }else{
    const best=exp.options.map(String).reduce((a,b)=>probabilities[b]>probabilities[a]?b:a,String(exp.options[0]));
    assert.equal(String(exp.correct),best,`${level}最可能选项计算错误`);
  }
}

assert.ok(paradise.includes('href="probability-lab.html"'),'游戏乐园缺少概率实验室入口');
assert.ok(paradise.includes('30 个游戏'),'游戏乐园数量没有更新为30');
assert.ok(roadmap.includes('**概率实验室（第一版）**'),'路线图没有标记概率实验室完成');
assert.ok(sources.includes('`probability-lab.html` 概率实验室'),'内容来源没有登记概率实验室');
assert.ok(html.includes('data-sound-standard="speech"'),'缺少声音能力标记');
assert.ok(html.includes('href="hpx-game-mobile.css"'),'没有接入移动端公共层');
assert.ok(html.includes('<script src="hpx-game-progress.js"></script>'),'没有接入成长记录');
console.log(`概率实验室检查通过：${generated}组彩球、转盘和双骰实验的理论概率、选项和抽样统计正确。`);
