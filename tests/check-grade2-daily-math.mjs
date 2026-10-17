import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../grade2-daily-math.html',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');
const footer=fs.readFileSync(new URL('../hpx-footer-actions.js',import.meta.url),'utf8');
const capture=fs.readFileSync(new URL('../hpx-daily-result-capture.js',import.meta.url),'utf8');

for(const [position,match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()){
  if(match[1].trim())new vm.Script(match[1],{filename:`grade2-daily-math.html#inline-${position+1}`});
}

const planStart=html.indexOf('const WEEK_PLAN=[');
const planEnd=html.indexOf('const COLORS=',planStart);
assert.ok(planStart>0&&planEnd>planStart,'找不到二年级每周训练安排');
const context={};
vm.runInNewContext(html.slice(planStart,planEnd)+'\nglobalThis.plan=WEEK_PLAN;',context);
const plan=context.plan;

assert.equal(plan.length,7,'每日训练应覆盖一周7天');
assert.ok(plan.every(day=>day.tasks.length===4),'每天应包含4项顺序练习');
const requiredTracks=['口算与运算','当日知识','综合应用','数学思维'];
for(const day of plan){
  assert.deepEqual(Array.from(day.tasks,item=>item.track),requiredTracks,`${day.day}的训练类别不完整或顺序不正确`);
  for(const task of day.tasks){
    assert.ok(task.title&&task.description&&task.minutes&&task.href,`${day.day}存在信息不完整的任务`);
    assert.ok(fs.existsSync(new URL('../'+task.href,import.meta.url)),`练习页面不存在：${task.href}`);
    const taskHtml=fs.readFileSync(new URL('../'+task.href,import.meta.url),'utf8');
    assert.ok(taskHtml.includes('hpx-footer-actions.js'),`练习页面无法加载每日错题采集层：${task.href}`);
  }
}

assert.ok(html.includes("const STORE='hpx_grade2_daily_math_v1'"),'缺少每日进度存储');
assert.ok(html.includes('id="historyList"')&&html.includes('id="historyTotal"'),'缺少每日训练记录区');
assert.match(html,/function renderHistory\(state\)[\s\S]*?slice\(0,14\)[\s\S]*?history-task/,'训练记录没有展示最近14个练习日及各项结果');
assert.match(html,/taskResults\[activeTaskIndex\]=Object\.assign\(\{\},previous,\{completedAt:[\s\S]*?lastPracticedAt:now,attempts:/,'没有保存每项练习的完成时间和练习次数');
assert.match(html,/done\.size===4&&!context\.record\.completedAt/,'没有记录每日全部完成时间');
assert.match(html,/new URLSearchParams\(\{from:'grade2-daily-math',date:context\.dateKey,task:String\(index\)\}\)/,'练习窗口没有携带每日记录上下文');
assert.match(html,/event\.source!==frame\.contentWindow/,'错题回传没有校验当前练习窗口来源');
assert.match(html,/type!=='hpx:grade2-daily-wrong'/,'没有接收统一错题明细');
assert.match(html,/data-review-id=/,'家长不能标记已检查的错题');
assert.ok(footer.includes("script.src = 'hpx-daily-result-capture.js'"),'公共页脚没有按需加载错题采集层');
assert.ok(capture.includes("params.get('from') !== 'grade2-daily-math'"),'错题采集层没有限制为每日数学训练');
assert.ok(capture.includes('new MutationObserver')&&capture.includes('global.parent.postMessage'),'错题采集层没有监听页面判错并回传');
assert.match(capture,/question:[\s\S]*?answer:[\s\S]*?correct:[\s\S]*?feedback:/,'错题明细字段不完整');
assert.ok(html.includes('id="weekDetail"')&&html.includes('id="weekDetailTasks"'),'一周安排缺少每日任务预览区');
assert.match(html,/data-preview-day="\$\{index\}"/,'周一至周日没有渲染为可点击日期');
assert.match(html,/function renderWeekDetail\(index\)[\s\S]*?plan\.tasks\.map/,'点击日期后没有展示当天四项练习');
assert.match(html,/weekList'\)\.addEventListener\('click'[\s\S]*?previewDayIndex=Number\(button\.dataset\.previewDay\)/,'没有处理一周日期切换');
assert.match(html,/findIndex\(\(_,index\)=>!done\.has\(index\)\)/,'没有按顺序寻找下一项任务');
assert.match(html,/isLocked\?'disabled':''/,'后续任务没有锁定');
assert.ok(html.includes('id="practiceDialog"')&&html.includes('id="practiceFrame"'),'缺少页内练习窗口');
assert.match(html,/function finishTask\(\)[\s\S]*?done\.add\(activeTaskIndex\)[\s\S]*?saveState\(context\.state\)[\s\S]*?render\(\)/,'完成任务后没有保存并进入下一项');
const footerScript=html.indexOf('<script src="hpx-footer-actions.js"></script>');
assert.ok(footerScript>=0&&footerScript<html.indexOf('</body>'),'公共页脚脚本必须位于 body 结束标签前');
assert.ok(index.includes('href="grade2-daily-math.html"')&&index.includes('二年级每日数学训练'),'首页缺少二年级每日数学入口');
assert.ok(sources.includes('`grade2-daily-math.html` 二年级每日数学训练'),'内容来源没有登记新页面');
assert.ok(!html.match(/<img|<audio|\.mp3|\.wav|@font-face|data:image/),'每日训练页不应引入外部图片、字体或录音');

console.log('二年级每日数学训练检查通过：7天计划、顺序解锁、本机进度及错题明细均已覆盖。');
