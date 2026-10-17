import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const html=fs.readFileSync(new URL('grade1-daily-chinese.html',root),'utf8');
const index=fs.readFileSync(new URL('index.html',root),'utf8');
const planPage=fs.readFileSync(new URL('chinese-study-plan.html',root),'utf8');
const sources=fs.readFileSync(new URL('CONTENT_SOURCES.md',root),'utf8');

for(const [position,match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()){
  if(match[1].trim())new vm.Script(match[1],{filename:`grade1-daily-chinese.html#inline-${position+1}`});
}

const planStart=html.indexOf('const WEEK_PLAN=['),planEnd=html.indexOf('const COLORS=',planStart);
assert.ok(planStart>0&&planEnd>planStart,'找不到一年级每周语文练习安排');
const context={};
vm.runInNewContext(html.slice(planStart,planEnd)+'\nglobalThis.plan=WEEK_PLAN;',context);
const plan=context.plan;

assert.equal(plan.length,7,'每日语文练习应覆盖一周7天');
assert.ok(plan.every(day=>day.tasks.length===4),'每天应包含4项顺序语文练习');
const requiredTracks=['拼音听读','识字词语','阅读表达','朗读积累'];
for(const day of plan){
  assert.deepEqual(Array.from(day.tasks,item=>item.track),requiredTracks,`${day.day}的语文练习类别不完整或顺序不正确`);
  for(const task of day.tasks){
    assert.ok(task.title&&task.description&&task.minutes&&task.href,`${day.day}存在信息不完整的任务`);
    assert.ok(fs.existsSync(new URL(task.href,root)),`练习页面不存在：${task.href}`);
  }
}

assert.ok(html.includes("const STORE='hpx_grade1_daily_chinese_v1'"),'缺少独立的语文每日进度存储');
assert.match(html,/findIndex\(\(_,index\)=>!done\.has\(index\)\)/,'没有按顺序寻找下一项练习');
assert.match(html,/isLocked\?'disabled':''/,'后续语文练习没有锁定');
assert.ok(html.includes('id="practiceDialog"')&&html.includes('id="practiceFrame"'),'缺少页内语文练习窗口');
assert.match(html,/data-preview-day="\$\{index\}"/,'周一至周日没有渲染为可点击日期');
assert.ok(html.includes('id="historyList"')&&html.includes('function renderHistory(state)'),'缺少每日语文练习记录');
assert.match(html,/function finishTask\(\)[\s\S]*?done\.add\(activeTaskIndex\)[\s\S]*?saveState\(context\.state\)[\s\S]*?render\(\)/,'完成单项后没有保存并刷新每日进度');
const footerScript=html.indexOf('<script src="hpx-footer-actions.js"></script>');
assert.ok(footerScript>=0&&footerScript<html.indexOf('</body>'),'公共页脚脚本必须位于 body 结束标签前');
assert.ok(index.includes('href="grade1-daily-chinese.html"')&&index.includes('一年级每日语文练习'),'首页缺少一年级每日语文入口');
assert.ok(planPage.includes('href="grade1-daily-chinese.html"'),'语文学习地图缺少一年级每日练习入口');
assert.ok(sources.includes('`grade1-daily-chinese.html` 一年级每日语文练习'),'内容来源没有登记新页面');
assert.ok(!html.match(/<img|<audio|\.mp3|\.wav|@font-face|data:image/),'每日语文页不应引入外部图片、字体或录音');

console.log('一年级每日语文练习检查通过：7天计划、每天4项、可预览日期、顺序解锁及本机记录均已覆盖。');
