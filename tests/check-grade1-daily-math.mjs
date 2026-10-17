import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const html=fs.readFileSync(new URL('grade1-daily-math.html',root),'utf8');
const index=fs.readFileSync(new URL('index.html',root),'utf8');
const planPage=fs.readFileSync(new URL('study-plan.html',root),'utf8');
const sources=fs.readFileSync(new URL('CONTENT_SOURCES.md',root),'utf8');

for(const [position,match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()){
  if(match[1].trim())new vm.Script(match[1],{filename:`grade1-daily-math.html#inline-${position+1}`});
}

const planStart=html.indexOf('const WEEK_PLAN=[');
const planEnd=html.indexOf('const COLORS=',planStart);
assert.ok(planStart>0&&planEnd>planStart,'找不到一年级每周练习安排');
const context={};
vm.runInNewContext(html.slice(planStart,planEnd)+'\nglobalThis.plan=WEEK_PLAN;',context);
const plan=context.plan;

assert.equal(plan.length,7,'每日练习应覆盖一周7天');
assert.ok(plan.every(day=>day.tasks.length===4),'每天应包含4项顺序练习');
const requiredTracks=['口算与运算','当日知识','综合应用','数学思维'];
for(const day of plan){
  assert.deepEqual(Array.from(day.tasks,item=>item.track),requiredTracks,`${day.day}的练习类别不完整或顺序不正确`);
  for(const task of day.tasks){
    assert.ok(task.title&&task.description&&task.minutes&&task.href,`${day.day}存在信息不完整的任务`);
    assert.ok(fs.existsSync(new URL(task.href,root)),`练习页面不存在：${task.href}`);
  }
}

assert.ok(html.includes("const STORE='hpx_grade1_daily_math_v1'"),'缺少独立的每日进度存储');
assert.match(html,/findIndex\(\(_,index\)=>!done\.has\(index\)\)/,'没有按顺序寻找下一项练习');
assert.match(html,/isLocked\?'disabled':''/,'后续练习没有锁定');
assert.ok(html.includes('id="practiceDialog"')&&html.includes('id="practiceFrame"'),'缺少页内单项练习窗口');
assert.match(html,/function finishTask\(\)[\s\S]*?done\.add\(activeTaskIndex\)[\s\S]*?saveState\(context\.state\)[\s\S]*?render\(\)/,'完成单项后没有保存并刷新每日进度');
assert.ok(html.includes('<script src="feedback.js?v=20260906-2"></script>'),'没有接入当前版本的意见反馈');
assert.ok(index.includes('href="grade1-daily-math.html"')&&index.includes('一年级每日数学练习'),'首页缺少一年级每日数学入口');
assert.ok(planPage.includes('href="grade1-daily-math.html"'),'数学学习地图缺少一年级每日练习入口');
assert.ok(planPage.includes('href="grade2-daily-math.html"'),'数学学习地图缺少二年级每日训练入口');
assert.ok(sources.includes('`grade1-daily-math.html` 一年级每日数学练习'),'内容来源没有登记新页面');
assert.ok(!html.match(/<img|<audio|\.mp3|\.wav|@font-face|data:image/),'每日练习页不应引入外部图片、字体或录音');

console.log('一年级每日数学练习检查通过：7天计划、每天4项、单项打开、顺序解锁及本机进度均已覆盖。');
