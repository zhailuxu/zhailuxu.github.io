import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('hpx-parent-report.js',root),'utf8');
const page=fs.readFileSync(new URL('parent-weekly-report.html',root),'utf8');
const daily=fs.readFileSync(new URL('daily-camp.html',root),'utf8');
const progressPage=fs.readFileSync(new URL('game-progress.html',root),'utf8');
const roadmap=fs.readFileSync(new URL('ROADMAP.md',root),'utf8');
const sources=fs.readFileSync(new URL('CONTENT_SOURCES.md',root),'utf8');
const context={globalThis:{},Date};
vm.runInContext(source,vm.createContext(context),{filename:'hpx-parent-report.js'});
const api=context.globalThis.HpxParentReport;
assert.ok(api,'家长周报API没有初始化');
assert.equal(api.ABILITIES.length,6,'周报没有覆盖6个能力方向');
assert.equal(Object.keys(api.GAME_ABILITY).length,30,'周报没有覆盖30个游戏');

const monday=new Date(2026,7,17,12,0,0);
const previousMonday=api.addDays(monday,-7);
const at=(start,day,hour=10)=>api.addDays(start,day).setHours(hour,0,0,0);
const events=[
  {gameId:'pattern-sequence',type:'complete',at:at(previousMonday,0),durationMs:60000},
  {gameId:'pattern-sequence',type:'mistake',at:at(previousMonday,0,11)},
  {gameId:'pattern-sequence',type:'complete',at:at(previousMonday,1),durationMs:60000},
  {gameId:'pattern-sequence',type:'mistake',at:at(previousMonday,1,11)},
  {gameId:'pattern-sequence',type:'visit',at:at(monday,0)},
  {gameId:'pattern-sequence',type:'complete',at:at(monday,0,11),durationMs:90000},
  {gameId:'pattern-sequence',type:'complete',at:at(monday,1),durationMs:90000},
  {gameId:'quantity-flash',type:'complete',at:at(monday,1,12),durationMs:30000}
];
const progress={events};
const camp={plans:{[api.dateKey(monday)]:{completedAt:at(monday,0)},[api.dateKey(api.addDays(monday,1))]:{completedAt:at(monday,1)}}};
const report=api.build(progress,camp,{status:'new'},monday);
assert.equal(api.dateKey(report.current.start),'2026-08-17','自然周没有从周一开始');
assert.equal(report.current.practiceDays,2,'练习天数统计错误');
assert.equal(report.current.completed,3,'完成次数统计错误');
assert.equal(report.current.totalMs,210000,'有效练习时间统计错误');
assert.equal(report.checkins.completedDays,2,'训练营打卡统计错误');
assert.equal(report.checkins.maxStreak,2,'周内连续打卡统计错误');
assert.equal(report.rows.find(row=>row.meta.id==='logic').trend,'更稳定','周环比趋势判断错误');
assert.equal(report.advice.enough,true,'满足门槛后仍被判断为数据不足');
const sparse=api.build({events:[events[4]]},{plans:{}},{status:'new'},monday);
assert.equal(sparse.advice.enough,false,'少量数据不应生成能力结论');

assert.ok(page.includes('打印 / 保存为 PDF'),'周报缺少打印入口');
assert.ok(page.includes('@media print'),'周报缺少打印布局');
assert.ok(page.includes('不提供儿童排名'),'周报缺少无排名隐私说明');
assert.ok(page.includes('本周记录还比较少'),'周报缺少数据不足提示');
assert.ok(daily.includes('href="parent-weekly-report.html"'),'每日训练营缺少家长周报入口');
assert.ok(progressPage.includes('href="parent-weekly-report.html"'),'成长记录缺少家长周报入口');
assert.ok(roadmap.includes('**家长周报（第一版）**'),'路线图没有标记家长周报完成');
assert.ok(sources.includes('`hpx-parent-report.js` / `parent-weekly-report.html` 家长周报'),'内容来源没有登记家长周报');
console.log('家长周报检查通过：周汇总、六能力、个人周环比、数据门槛、打卡、打印和本地隐私完整。');
