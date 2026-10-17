import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../shape-sudoku.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const roadmap=fs.readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n\}\)\(\);/);
assert.ok(match,'找不到图形数独主脚本');
const window={};
vm.runInContext(match[0],vm.createContext({window,Math,console,Set}),{filename:'shape-sudoku.html'});
const api=window.ShapeSudoku;
assert.ok(api,'图形数独测试接口没有初始化');

let generated=0;
for(const [level,cfg] of Object.entries(api.CONFIG)){
  for(let i=0;i<30;i++){
    const item=api.generatePuzzle(level);generated++;
    assert.equal(item.solution.length,cfg.size**2,`${level} 完整盘尺寸错误`);
    assert.equal(item.puzzle.length,cfg.size**2,`${level} 题盘尺寸错误`);
    assert.ok(api.validGrid(item.solution,cfg,true),`${level} 完整盘违反行列或分区规则`);
    assert.equal(api.countSolutions(item.puzzle,cfg,2),1,`${level} 题盘不是唯一解`);
    assert.ok(item.puzzle.filter(value=>!value).length>=cfg.holes,`${level} 挖空数量不足`);
    for(let index=0;index<item.puzzle.length;index++)if(item.puzzle[index])assert.equal(item.puzzle[index],item.solution[index],`${level} 已知数字和答案不一致`);
  }
}

assert.ok(paradise.includes('href="shape-sudoku.html"'),'游戏乐园缺少图形数独入口');
assert.ok(paradise.includes('30 个游戏'),'游戏乐园数量没有更新为30');
assert.ok(roadmap.includes('**图形数独（第一版）**'),'路线图没有标记图形数独完成');
assert.ok(sources.includes('`shape-sudoku.html` 图形数独'),'内容来源没有登记图形数独');
assert.ok(html.includes('data-sound-standard="speech"'),'缺少声音能力标记');
assert.ok(html.includes('href="hpx-game-mobile.css"'),'没有接入移动端公共层');
assert.ok(html.includes('<script src="hpx-game-progress.js"></script>'),'没有接入成长记录');
assert.ok(html.includes('<script src="feedback.js?v=20260906-2"></script>'),'没有接入意见反馈');
console.log(`图形数独检查通过：${generated}组4×4、6×6和9×9题盘均有效且保持唯一解。`);
