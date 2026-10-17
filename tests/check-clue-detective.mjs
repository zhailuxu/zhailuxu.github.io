import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../clue-detective.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const roadmap=fs.readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n\}\)\(\);/);
assert.ok(match,'找不到真假线索侦探主脚本');
const window={};
vm.runInContext(match[0],vm.createContext({window,Math,console}),{filename:'clue-detective.html'});
const api=window.ClueDetective;
assert.ok(api,'真假线索侦探测试接口没有初始化');
assert.equal(api.permutations([0,1,2]).length,6,'三项全排列数量错误');
assert.equal(api.makeSolutions(3,true).length,36,'人物、物品、地点候选空间错误');

let generated=0;
for(const [level,cfg] of Object.entries(api.CONFIG))for(let i=0;i<300;i++){
  const puzzle=api.generatePuzzle(level);generated++;
  assert.equal(puzzle.size,cfg.size,`${level}人物数量错误`);
  assert.equal(puzzle.withPlaces,cfg.places,`${level}地点规则错误`);
  const reliable=puzzle.clues.filter((_,index)=>index!==puzzle.falseIndex);
  assert.ok(reliable.every(clue=>api.holds(puzzle.secret,clue)),`${level}可靠线索与答案冲突`);
  assert.equal(api.solve(puzzle.size,puzzle.withPlaces,reliable).length,1,`${level}可靠线索不能唯一破案`);
  if(cfg.falseClue){
    assert.ok(puzzle.falseIndex>=0,`${level}缺少不可靠线索`);
    assert.equal(api.holds(puzzle.secret,puzzle.clues[puzzle.falseIndex]),false,`${level}假线索竟然符合答案`);
  }else assert.equal(puzzle.falseIndex,-1,'简单案件不应混入假线索');
  const marks=api.emptyMarks(puzzle);
  for(let p=0;p<puzzle.size;p++)for(let v=0;v<puzzle.size;v++){
    marks.item[p][v]=puzzle.secret.itemOf[p]===v?'yes':'no';
    if(puzzle.withPlaces)marks.place[p][v]=puzzle.secret.placeOf[p]===v?'yes':'no';
  }
  assert.equal(api.validateMarks(puzzle,marks),true,`${level}完整正确推理表未通过校验`);
  marks.item[0][0]=marks.item[0][0]==='yes'?'no':'yes';
  assert.equal(api.validateMarks(puzzle,marks),false,`${level}错误推理表通过校验`);
}

assert.ok(paradise.includes('href="clue-detective.html"'),'游戏乐园缺少真假线索侦探入口');
assert.ok(paradise.includes('30 个游戏'),'游戏乐园数量没有更新为30');
assert.ok(roadmap.includes('**真假线索侦探（第一版）**'),'路线图没有标记真假线索侦探完成');
assert.ok(sources.includes('`clue-detective.html` 真假线索侦探'),'内容来源没有登记真假线索侦探');
assert.ok(html.includes('data-sound-standard="speech"'),'缺少声音能力标记');
assert.ok(html.includes('href="hpx-game-mobile.css"'),'没有接入移动端公共层');
assert.ok(html.includes('<script src="hpx-game-progress.js"></script>'),'没有接入成长记录');
console.log(`真假线索侦探检查通过：${generated}个随机案件的真假线索、唯一解和推理表校验正确。`);
