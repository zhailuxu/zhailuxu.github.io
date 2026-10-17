import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('hpx-game-progress.js',root),'utf8');
const paradise=fs.readFileSync(new URL('game-paradise.html',root),'utf8');
const dashboard=fs.readFileSync(new URL('game-progress.html',root),'utf8');
const roadmap=fs.readFileSync(new URL('ROADMAP.md',root),'utf8');
const sources=fs.readFileSync(new URL('CONTENT_SOURCES.md',root),'utf8');
const context={globalThis:{},console,Date};
vm.runInContext(source,vm.createContext(context),{filename:'hpx-game-progress.js'});
const api=context.globalThis.HpxGameProgress;
assert.ok(api,'成长记录API没有初始化');
assert.equal(Object.keys(api.GAMES).length,30,'游戏元数据没有覆盖30个游戏');

let data=api.empty();
data=api.apply(data,{gameId:'shape-packing',type:'visit',level:'hard',mode:'practice'},1000);
data=api.apply(data,{gameId:'shape-packing',type:'mistake',level:'hard',mode:'practice'},2000);
data=api.apply(data,{gameId:'shape-packing',type:'hint',level:'hard',mode:'practice'},2500);
data=api.apply(data,{gameId:'shape-packing',type:'complete',level:'hard',mode:'practice',durationMs:120000},121000);
data=api.apply(data,{gameId:'quantity-flash',type:'visit',level:'easy',mode:'challenge'},130000);
data=api.apply(data,{gameId:'quantity-flash',type:'complete',level:'easy',mode:'challenge',durationMs:30000},160000);
const sum=api.summary(data);
assert.equal(sum.tracked,2,'玩过游戏数量统计错误');
assert.equal(sum.completed,2,'完成次数统计错误');
assert.equal(sum.mistakes,1,'误选次数统计错误');
assert.equal(sum.hints,1,'提示次数统计错误');
assert.equal(sum.totalMs,150000,'练习时间统计错误');
assert.equal(sum.accuracy,67,'综合正确率计算错误');
assert.equal(data.games['shape-packing'].bestMs,120000,'最佳用时保存错误');
assert.equal(data.games['shape-packing'].levels.hard.mistakes,1,'分难度误选没有记录');
assert.equal(api.weakAreas(data,3)[0].gameId,'shape-packing','薄弱项排序错误');

for(const id of Object.keys(api.GAMES)){
  const html=fs.readFileSync(new URL(`${id}.html`,root),'utf8');
  assert.ok(html.includes('<script src="hpx-game-progress.js"></script>'),`${id}.html没有接入成长记录层`);
}
assert.ok(paradise.includes('href="game-progress.html"'),'游戏乐园缺少成长记录入口');
assert.ok(dashboard.includes('隐私说明'),'成长报告缺少本地存储隐私说明');
assert.ok(dashboard.includes('清空本机记录'),'成长报告缺少清空功能');
assert.ok(dashboard.includes('导出记录'),'成长报告缺少导出功能');
assert.ok(roadmap.includes('**游戏成长记录（第一版）**'),'路线图没有标记成长记录完成');
assert.ok(sources.includes('`hpx-game-progress.js` / `game-progress.html` 游戏成长记录'),'内容来源没有登记成长记录');
console.log('游戏成长记录检查通过：30个游戏已接入，本地统计、分难度薄弱项、导出和清空入口完整。');
