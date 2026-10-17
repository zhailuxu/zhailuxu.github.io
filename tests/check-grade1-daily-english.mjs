import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pagePath=path.join(root,'grade1-daily-english.html');
const html=fs.readFileSync(pagePath,'utf8');
const fail=message=>{throw new Error(message);};
const expect=(condition,message)=>{if(!condition)fail(message);};

const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match=>match[1]).filter(Boolean);
scripts.forEach((source,index)=>new vm.Script(source,{filename:`grade1-daily-english-inline-${index+1}.js`}));

const planMatch=html.match(/const WEEK_PLAN=([\s\S]*?);\nconst COLORS=/);
expect(planMatch,'未找到 WEEK_PLAN');
const sandbox={DAYS:['星期一','星期二','星期三','星期四','星期五','星期六','星期日'],THEMES:['a','b','c','d','e','f','g'],READER_TITLES:['a','b','c','d','e','f','g'],THIRD:Array.from({length:7},()=>({title:'x',href:'english.html?tab=match',description:'x'}))};
const plan=vm.runInNewContext(`(${planMatch[1]})`,sandbox);
expect(plan.length===7,'每日计划必须包含 7 天');
const tracks=['字母语音','数字词汇','听读认词','启蒙阅读'];
plan.forEach((day,dayIndex)=>{
  expect(day.tasks.length===4,`第 ${dayIndex+1} 天不是 4 项任务`);
  expect(JSON.stringify(day.tasks.map(task=>task.track))===JSON.stringify(tracks),`第 ${dayIndex+1} 天任务顺序错误`);
  day.tasks.forEach(task=>{
    const file=task.href.split(/[?#]/)[0];
    expect(fs.existsSync(path.join(root,file)),`练习页面不存在：${task.href}`);
  });
});

expect(html.includes("hpx_grade1_daily_english_v1"),'缺少英语每日记录存储键');
expect(html.includes('data-preview-day'),'一周安排不能点击预览');
expect(html.includes('practiceDialog')&&html.includes('practiceFrame'),'缺少页内练习弹窗');
expect(html.includes('disabled'), '缺少顺序解锁控制');
expect(html.includes('historyList')&&html.includes('completedAt'),'缺少每日完成记录');
expect(html.includes('<script src="hpx-footer-actions.js"></script>\n</body>'),'页脚组件必须在 </body> 前引入');
expect(!/<(?:img|audio)\b|data:image|@font-face|\.(?:mp3|wav)\b/i.test(html),'新页面不应引入外部图片、字体或音频');

const english=fs.readFileSync(path.join(root,'english.html'),'utf8');
const reader=fs.readFileSync(path.join(root,'english-reader-1a.html'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const map=fs.readFileSync(path.join(root,'english-study-plan.html'),'utf8');
const sources=fs.readFileSync(path.join(root,'CONTENT_SOURCES.md'),'utf8');
expect(english.includes("new URLSearchParams(window.location.search).get('tab')"),'英语主页未支持指定栏目');
expect(reader.includes("params.get('lesson')")&&reader.includes("params.get('mode')"),'启蒙阅读未支持指定课程和练习模式');
expect(index.includes('href="grade1-daily-english.html"'),'首页缺少每日英语入口');
expect(map.includes('href="grade1-daily-english.html"'),'英语学习地图缺少每日英语入口');
expect(sources.includes('`grade1-daily-english.html` 一年级每日英语练习'),'内容来源登记缺少新页面');

console.log('一年级每日英语练习检查通过：7 天 × 4 项、定向栏目、顺序解锁、周预览、本机记录、入口、来源和页脚均已覆盖。');
