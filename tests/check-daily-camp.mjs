import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('hpx-daily-camp.js',root),'utf8');
const page=fs.readFileSync(new URL('daily-camp.html',root),'utf8');
const paradise=fs.readFileSync(new URL('game-paradise.html',root),'utf8');
const home=fs.readFileSync(new URL('index.html',root),'utf8');
const progressSource=fs.readFileSync(new URL('hpx-game-progress.js',root),'utf8');
const sources=fs.readFileSync(new URL('CONTENT_SOURCES.md',root),'utf8');
const store=new Map();
const context={globalThis:{localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)}},Date};
vm.runInContext(source,vm.createContext(context),{filename:'hpx-daily-camp.js'});
const api=context.globalThis.HpxDailyCamp;
assert.ok(api,'每日训练营API没有初始化');
assert.deepEqual(Array.from(api.TRACKS,track=>track.id),['calculation','logic','focus'],'每日任务没有覆盖三种能力');
const progress={games:{'number-maze':{completed:1,mistakes:5,lastPlayed:0}}};
const state=api.empty();
const plan=api.createPlan('2026-08-18',progress,state,1000);
assert.equal(plan.items.length,3,'每日计划不是3项');
assert.equal(new Set(Array.from(plan.items,item=>item.gameId)).size,3,'每日计划出现重复游戏');
assert.equal(plan.items[0].gameId,'number-maze','推荐没有优先照顾明显困难的计算游戏');
const hintedPlan=api.createPlan('2026-08-19',{games:{'story-order':{hints:10,lastPlayed:0}}},api.empty(),1000);
assert.equal(hintedPlan.items[1].gameId,'story-order','推荐没有以较小权重参考提示记录');
assert.equal(api.syncPlan(plan,{games:{[plan.items[0].gameId]:{completed:2}}},2000),true,'完成游戏后没有同步训练进度');
assert.ok(plan.items[0].completedAt,'训练任务未标记完成');
plan.items.forEach(item=>{item.completedAt=2000});plan.completedAt=2000;state.plans['2026-08-18']=plan;
assert.equal(api.streak(state,'2026-08-18'),1,'连续完成天数计算错误');
const recap=api.buildRecap(plan,{events:[
  {gameId:plan.items[0].gameId,type:'complete',at:2100,durationMs:180000},
  {gameId:plan.items[1].gameId,type:'mistake',level:'hard',at:2200},
  {gameId:plan.items[1].gameId,type:'hint',level:'hard',at:2300},
  {gameId:plan.items[1].gameId,type:'complete',level:'hard',at:2400,durationMs:240000},
  {gameId:plan.items[2].gameId,type:'complete',at:2500,durationMs:120000},
  {gameId:plan.items[2].gameId,type:'mistake',at:500}
]});
assert.equal(recap.completed,3,'复盘完成次数错误');
assert.equal(recap.mistakes,1,'复盘没有排除计划创建前的误选');
assert.equal(recap.hints,1,'复盘提示次数错误');
assert.equal(recap.totalMs,540000,'复盘有效时长错误');
assert.equal(recap.needs.id,plan.items[1].track,'复盘没有识别本次需要加强的方向');
assert.ok(recap.next.includes('避免连续重复'),'复盘没有解释明日推荐调整');
const strengthen=api.extraPractice(plan,{events:[
  {gameId:plan.items[1].gameId,type:'mistake',level:'hard',at:2200},
  {gameId:plan.items[1].gameId,type:'hint',level:'hard',at:2300}
]});
assert.equal(strengthen.kind,'strengthen','出现困难时没有生成针对性加练');
assert.equal(strengthen.gameId,plan.items[1].gameId,'针对性加练没有指向需要加强的游戏');
assert.equal(strengthen.level,'hard','针对性加练没有沿用困难较多的难度');
const explore=api.extraPractice(plan,{games:{},events:plan.items.map((item,index)=>({gameId:item.gameId,type:'complete',level:'easy',at:3000+index}))});
assert.equal(explore.kind,'explore','没有明显困难时没有生成探索推荐');
assert.ok(!plan.items.some(item=>item.gameId===explore.gameId),'探索推荐与今日三个游戏重复');
assert.ok(page.includes('只保存在当前浏览器'),'训练营缺少本地隐私说明');
assert.ok(page.includes('约 3～5 分钟'),'训练营缺少单项时长说明');
assert.ok(page.includes('id="dailyRecap"')&&page.includes('明日调整'),'训练营缺少完成后的今日复盘卡');
assert.ok(page.includes('id="extraPractice"')&&page.includes('?from=daily-camp&level='),'训练营缺少不影响打卡的一键加练入口');
assert.ok(paradise.includes('href="daily-camp.html"'),'游戏乐园缺少每日训练营入口');
assert.ok(home.includes('href="daily-camp.html"'),'首页缺少每日训练营入口');
assert.ok(progressSource.includes("get('from')==='daily-camp'"),'游戏页缺少返回训练营通道');
assert.ok(sources.includes('`hpx-daily-camp.js` / `daily-camp.html` 每日训练营'),'内容来源没有登记每日训练营');
console.log('每日训练营检查通过：三能力推荐、今日复盘、针对性加练、探索推荐、打卡和本地隐私完整。');
