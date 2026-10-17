import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../arithmetic-blocks.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const roadmap=fs.readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n\}\)\(\);/);
assert.ok(match,'找不到算式积木主脚本');
const window={};
vm.runInContext(match[0],vm.createContext({window,Math,console}),{filename:'arithmetic-blocks.html'});
const api=window.ArithmeticBlocks;
assert.ok(api,'算式积木测试接口没有初始化');

const number=(value,id=0)=>({type:'number',value,id});
const operator=value=>({type:'operator',value});
const paren=value=>({type:'paren',value});
assert.equal(api.evaluateTokens([number(3),operator('+'),number(4),operator('×'),number(2)]),11,'乘法优先级错误');
assert.equal(api.evaluateTokens([paren('('),number(3),operator('+'),number(4),paren(')'),operator('×'),number(2)]),14,'括号优先级错误');
assert.equal(api.evaluateTokens([number(8),operator('÷'),number(2),operator('-'),number(1)]),3,'除减运算错误');
assert.equal(api.evaluateTokens([number(3),number(4)]),null,'相邻数字应判为无效');
assert.equal(api.evaluateTokens([paren('('),number(3),operator('+'),number(4)]),null,'未闭合括号应判为无效');

let generated=0;
for(const [level,cfg] of Object.entries(api.CONFIG))for(let i=0;i<120;i++){
  const puzzle=api.generatePuzzle(level);generated++;
  assert.equal(puzzle.numbers.length,cfg.count,`${level}数字积木数量错误`);
  assert.deepEqual(Array.from(puzzle.ops),Array.from(cfg.ops),`${level}运算符配置错误`);
  assert.equal(puzzle.minBlocks,cfg.min,`${level}最少积木数不符合难度`);
  const solved=api.solvePuzzle(Array.from(puzzle.numbers),Array.from(puzzle.ops),puzzle.target);
  assert.equal(solved.minBlocks,puzzle.minBlocks,`${level}最少积木数与复算结果不一致`);
  assert.ok(solved.solutions.length>0,`${level}题目无解`);
  assert.equal(solved.solutions[0].expr,puzzle.sample,`${level}示例最短解不一致`);
}

assert.ok(html.includes('不使用 eval'),'缺少安全表达式解析说明');
assert.ok(!html.match(/\beval\s*\(/),'页面不应执行eval');
assert.ok(html.includes('data-sound-standard="speech"'),'缺少声音能力标记');
assert.ok(html.includes('href="hpx-game-mobile.css"'),'没有接入移动端公共层');
assert.ok(html.includes('<script src="hpx-game-progress.js"></script>'),'没有接入成长记录');
assert.ok(paradise.includes('href="arithmetic-blocks.html"'),'游戏乐园缺少算式积木入口');
assert.ok(paradise.includes('30 个游戏'),'游戏乐园数量没有更新为30');
assert.ok(roadmap.includes('**算式积木（第一版）**'),'路线图没有标记算式积木完成');
assert.ok(sources.includes('`arithmetic-blocks.html` 算式积木'),'内容来源没有登记算式积木');
console.log(`算式积木检查通过：${generated}组随机题的最少块求解、四则运算和括号解析正确。`);
