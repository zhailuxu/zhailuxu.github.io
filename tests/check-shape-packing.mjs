import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../shape-packing.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const roadmap=fs.readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n\}\)\(\);/);
assert.ok(match,'找不到图形装箱主脚本');
const window={};
vm.runInContext(match[0],vm.createContext({window,Math,console}),{filename:'shape-packing.html'});
const api=window.ShapePacking;
assert.ok(api,'图形装箱测试接口没有初始化');

let generated=0;
for(const [level,cfg] of Object.entries(api.CONFIG)){
  for(let i=0;i<1000;i++){
    const puzzle=api.generatePuzzle(level);generated++;
    assert.equal(puzzle.size,cfg.size,`${level} 箱子尺寸错误`);
    assert.equal(puzzle.pieces.length,cfg.pieceSizes.length,`${level} 拼块数量错误`);
    assert.equal(puzzle.pieces.reduce((sum,piece)=>sum+piece.cells.length,0),cfg.size**2,`${level} 拼块总面积没有铺满箱子`);
    assert.equal(new Set(puzzle.pieces.map(piece=>piece.id)).size,puzzle.pieces.length,`${level} 拼块编号重复`);
    let board=Array(cfg.size**2).fill(0);
    for(const piece of puzzle.pieces){
      assert.ok(api.connected(piece.cells),`${level} 出现不相邻的拼块`);
      assert.ok(piece.initialRotation>=0&&piece.initialRotation<=3,`${level} 初始旋转无效`);
      assert.equal(JSON.stringify(api.rotateCells(piece.cells,4)),JSON.stringify(api.normalize(piece.cells)),`${level} 旋转四次没有复原`);
      assert.ok(api.canPlace(board,cfg.size,piece,piece.solution.r,piece.solution.c,0),`${level} 参考解发生越界或重叠`);
      board=api.placePiece(board,cfg.size,piece,piece.solution.r,piece.solution.c,0);
      assert.ok(board,`${level} 参考解放置失败`);
    }
    assert.ok(api.isComplete(board),`${level} 参考解没有铺满箱子`);
    const first=puzzle.pieces[0];
    assert.equal(api.canPlace(board,cfg.size,first,first.solution.r,first.solution.c,0),false,`${level} 没有阻止重叠放置`);
    assert.equal(api.canPlace(Array(cfg.size**2).fill(0),cfg.size,first,-1,0,0),false,`${level} 没有阻止越界放置`);
  }
}
assert.ok(paradise.includes('href="shape-packing.html"'),'游戏乐园缺少图形装箱入口');
assert.ok(paradise.includes('30 个游戏'),'游戏乐园数量没有更新为30');
assert.ok(roadmap.includes('**图形装箱（第一版）**'),'路线图没有标记图形装箱完成');
assert.ok(sources.includes('`shape-packing.html` 图形装箱'),'内容来源没有登记图形装箱');
assert.ok(html.includes('data-sound-standard="speech"'),'缺少声音能力标记');
assert.ok(html.includes('<script src="hpx-core.js"></script>'),'没有接入公共语音层');
assert.ok(html.includes('id="speakToggle"'),'缺少声音开关');
console.log(`图形装箱检查通过：${generated}组随机拼板的连通性、旋转、边界和完整参考解全部正确。`);
