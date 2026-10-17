import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../block-escape.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const roadmap=fs.readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n\}\)\(\);/);
assert.ok(match,'找不到方块脱困主脚本');
const window={};
vm.runInContext(match[0],vm.createContext({window,Math,console,Set}),{filename:'block-escape.html'});
const api=window.BlockEscape;
assert.ok(api,'方块脱困测试接口没有初始化');

let generated=0;
for(const [level,cfg] of Object.entries(api.CONFIG))for(let i=0;i<15;i++){
  const puzzle=api.buildPuzzle(level);generated++;
  assert.equal(puzzle.size,cfg.size,`${level}棋盘尺寸错误`);
  assert.equal(puzzle.blocks.length,cfg.count,`${level}方块数量错误`);
  assert.equal(puzzle.blocks[0].target,true,`${level}缺少目标方块`);
  const occupied=new Set();
  puzzle.blocks.forEach((block,index)=>api.cells(block,puzzle.positions[index]).forEach(cell=>{
    assert.ok(cell.r>=0&&cell.c>=0&&cell.r<puzzle.size&&cell.c<puzzle.size,`${level}方块越界`);
    const key=`${cell.r},${cell.c}`;assert.ok(!occupied.has(key),`${level}方块重叠`);occupied.add(key);
  }));
  assert.equal(api.isSolved(puzzle.blocks,puzzle.positions,puzzle.size),false,`${level}初始状态已经完成`);
  const solution=api.solvePuzzle(puzzle);
  assert.ok(solution&&solution.length>=cfg.minSteps,`${level}没有达到可解步数要求`);
  let positions=puzzle.positions.map(pos=>({...pos}));
  for(const move of solution){assert.ok(api.canMove(puzzle.blocks,positions,move.index,move.dir,puzzle.size),`${level}解答包含非法移动`);positions=api.moveBlock(puzzle.blocks,positions,move.index,move.dir,puzzle.size)}
  assert.ok(api.isSolved(puzzle.blocks,positions,puzzle.size),`${level}参考步骤未能脱困`);
}

assert.ok(paradise.includes('href="block-escape.html"'),'游戏乐园缺少方块脱困入口');
assert.ok(paradise.includes('30 个游戏'),'游戏乐园数量没有更新为30');
assert.ok(roadmap.includes('**方块脱困（第一版）**'),'路线图没有标记方块脱困完成');
assert.ok(sources.includes('`block-escape.html` 方块脱困'),'内容来源没有登记方块脱困');
assert.ok(html.includes('pointerdown')&&html.includes('pointerup'),'缺少手机滑动操作');
assert.ok(html.includes('data-sound-standard="speech"'),'缺少声音能力标记');
assert.ok(html.includes('href="hpx-game-mobile.css"'),'没有接入移动端公共层');
assert.ok(html.includes('<script src="hpx-game-progress.js"></script>'),'没有接入成长记录');
console.log(`方块脱困检查通过：${generated}个程序生成棋盘无越界、无重叠，求解器均可完成。`);
