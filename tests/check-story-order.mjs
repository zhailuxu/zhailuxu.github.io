import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('hpx-story-order.js',root),'utf8');
const html=fs.readFileSync(new URL('story-order.html',root),'utf8');
const paradise=fs.readFileSync(new URL('game-paradise.html',root),'utf8');
const daily=fs.readFileSync(new URL('hpx-daily-camp.js',root),'utf8');
const progress=fs.readFileSync(new URL('hpx-game-progress.js',root),'utf8');
const parent=fs.readFileSync(new URL('hpx-parent-report.js',root),'utf8');
const sources=fs.readFileSync(new URL('CONTENT_SOURCES.md',root),'utf8');
const context={globalThis:{},Math};
vm.runInContext(source,vm.createContext(context),{filename:'hpx-story-order.js'});
const api=context.globalThis.HpxStoryOrder;
assert.ok(api,'故事排序生成器没有初始化');
assert.equal(api.SCENARIOS.length,8,'原创故事数量应为8组');
assert.equal(new Set(api.SCENARIOS.map(item=>item.id)).size,8,'故事编号存在重复');
for(const scenario of api.SCENARIOS){
  assert.equal(scenario.steps.length,5,`${scenario.id}不是五步故事`);
  assert.ok(scenario.steps.every(step=>step.length>=8),`${scenario.id}含过短故事卡`);
  assert.ok(scenario.distractor.length>=8&&scenario.reason.length>=10,`${scenario.id}缺少完整干扰句或理由`);
}

let generated=0;
for(const level of ['easy','medium','hard'])for(let i=0;i<1000;i++){
  const puzzle=api.generate(level);generated++;
  const expected=level==='easy'?3:5;
  assert.equal(puzzle.correctIds.length,expected,`${level}正确顺序长度错误`);
  assert.equal(puzzle.cards.length,expected+(level==='hard'?1:0),`${level}卡片数量错误`);
  const initialActive=puzzle.cards.filter(card=>!card.distractor).map(card=>card.id);
  assert.notDeepEqual(initialActive,puzzle.correctIds,`${level}初始顺序不应已经正确`);
  assert.equal(puzzle.reasons.filter(reason=>reason.correct).length,1,`${level}应只有一个正确理由`);
  assert.equal(api.validate(puzzle,puzzle.correctIds.concat(level==='hard'?[puzzle.distractorId]:[]),level==='hard'?puzzle.distractorId:null),true,`${level}正确答案没有通过`);
  const wrong=puzzle.correctIds.slice();[wrong[0],wrong[1]]=[wrong[1],wrong[0]];
  assert.equal(api.validate(puzzle,wrong.concat(level==='hard'?[puzzle.distractorId]:[]),level==='hard'?puzzle.distractorId:null),false,`${level}错误顺序通过了`);
  if(level==='hard')assert.equal(api.validate(puzzle,puzzle.correctIds.concat([puzzle.distractorId]),puzzle.correctIds[0]),false,'错误干扰卡通过了');
}

for(const level of ['easy','medium','hard'])assert.ok(html.includes(`data-level="${level}"`),`页面缺少${level}难度`);
assert.ok(html.includes('data-action="up"')&&html.includes('data-action="down"'),'页面缺少按钮排序操作');
assert.ok(html.includes('class="speak-card"')&&html.includes('data-action="speak"'),'每张故事卡缺少选项朗读按钮');
assert.ok(html.includes("button.dataset.action==='speak'")&&html.includes('say(item.text)'),'选项朗读按钮没有朗读对应卡片内容');
assert.ok(html.includes('不认识的字可以点击喇叭听完整选项'),'玩法说明没有提示选项朗读功能');
assert.ok(html.includes('data-action="exclude"')&&html.includes('为什么要这样排序'),'困难模式缺少干扰句或理由判断');
assert.ok(html.includes('data-sound-standard="speech"'),'页面缺少声音能力标记');
assert.ok(html.includes('href="hpx-game-mobile.css"'),'页面没有接入移动端公共层');
assert.ok(html.includes('<script src="hpx-game-progress.js"></script>'),'页面没有接入成长记录');
assert.ok(paradise.includes('href="story-order.html"')&&paradise.includes('30 个游戏'),'游戏乐园没有保留故事排序入口或最新游戏总数');
assert.ok(daily.includes("'story-order'")&&progress.includes("'story-order':{name:'故事排序'")&&parent.includes("'story-order':'logic'"),'本地推荐、成长记录或家长周报接入不完整');
assert.ok(sources.includes('`hpx-story-order.js` / `story-order.html` 故事排序'),'内容来源没有登记故事排序');
console.log(`故事排序检查通过：${generated}组三级随机题、8组原创故事、按钮操作和30游戏本地联动完整。`);
