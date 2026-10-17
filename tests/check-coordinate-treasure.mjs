import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../coordinate-treasure.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const roadmap=fs.readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n\}\)\(\);/);
assert.ok(match,'找不到坐标寻宝主脚本');
const window={};
vm.runInContext(match[0],vm.createContext({window,Math,console}),{filename:'coordinate-treasure.html'});
const api=window.CoordinateTreasure;
assert.ok(api,'坐标寻宝测试接口没有初始化');
const moved=api.applyMove({x:2,y:3},{dx:1,dy:0,steps:2});
assert.equal(`${moved.x},${moved.y}`,'4,3','向东移动计算错误');
assert.equal(api.inside({x:0,y:0},5),true,'原点应在地图内');
assert.equal(api.inside({x:5,y:0},5),false,'地图右边界判断错误');

let generated=0;
for(const [level,cfg] of Object.entries(api.CONFIG))for(let i=0;i<1000;i++){
  const puzzle=api.generatePuzzle(level);generated++;
  assert.equal(puzzle.type,cfg.type,`${level}题型错误`);
  assert.equal(puzzle.size,cfg.size,`${level}地图尺寸错误`);
  assert.equal(api.isValidPuzzle(puzzle),true,`${level}题目目标无效`);
  assert.equal(api.inside(puzzle.target,puzzle.size),true,`${level}宝藏越界`);
  if(level==='easy'){
    assert.equal(puzzle.moves.length,1,'简单题应只有一段移动');
    assert.equal(api.key(api.resolveMoves(puzzle.start,puzzle.moves)),api.key(puzzle.target),'简单题移动终点错误');
  }else if(level==='medium'){
    assert.equal(puzzle.target.x,puzzle.col-1,'列号没有正确映射到横向位置');
    assert.equal(puzzle.target.y,puzzle.size-puzzle.row,'行号没有正确映射到纵向位置');
  }else{
    assert.equal(puzzle.moves.length,2,'困难题应有两段移动');
    assert.ok(puzzle.moves.some(move=>move.dx!==0)&&puzzle.moves.some(move=>move.dy!==0),'困难题缺少横向或纵向移动');
    assert.equal(api.key(api.resolveMoves(puzzle.start,puzzle.moves)),api.key(puzzle.target),'困难题坐标终点错误');
  }
}

assert.ok(html.includes('data-sound-standard="speech"'),'缺少声音能力标记');
assert.ok(html.includes('href="hpx-game-mobile.css"'),'没有接入移动端公共层');
assert.ok(html.includes('<script src="hpx-game-progress.js"></script>'),'没有接入成长记录');
assert.ok(paradise.includes('href="coordinate-treasure.html"'),'游戏乐园缺少坐标寻宝入口');
assert.ok(paradise.includes('30 个游戏'),'游戏乐园数量没有更新为30');
assert.ok(roadmap.includes('**坐标寻宝（第一版）**'),'路线图没有标记坐标寻宝完成');
assert.ok(sources.includes('`coordinate-treasure.html` 坐标寻宝'),'内容来源没有登记坐标寻宝');
console.log(`坐标寻宝检查通过：${generated}张方向移动、行列定位和平面坐标随机地图均有效。`);
