import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../english-reader-1a.html',import.meta.url),'utf8');
for(const [index,match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()){
  if(match[1].trim())new vm.Script(match[1],{filename:`english-reader-1a.html#inline-${index+1}`});
}

const start=html.indexOf('const LESSONS=');
const end=html.indexOf('const speech=',start);
const context={};
vm.runInNewContext(html.slice(start,end)+'\nglobalThis.lessons=LESSONS;',context);
const lessons=Array.from(context.lessons);

assert.equal(lessons.length,8,'启蒙阅读必须包含8个原创单元');
assert.equal(lessons.flatMap(item=>item.sentences).length,32,'每课应有4句，共32句');
assert.ok(lessons.every(item=>item.words.length===4),'每课应有4个核心词');
assert.equal(new Set(lessons.map(item=>item.title)).size,8,'单元标题不能重复');
assert.ok(html.includes("Hpx.speech.create({buttonId:'speakToggle',lang:'en-US'"),'页面没有使用公共英语朗读能力');
assert.ok(['listen','meaning','missing'].every(type=>html.includes(`data-mode="${type}"`)),'三种练习题型不完整');
assert.ok(html.includes("localStorage.setItem('hpx_reader_1a_done'"),'页面没有保存学习进度');
assert.ok(!html.includes('典范英语'),'原创页面不应使用指定教材名称');

const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert.ok(index.includes('href="english-reader-1a.html"'),'首页缺少英语启蒙阅读入口');

console.log('英语启蒙阅读1A检查通过：8课32句、核心词、三类练习、朗读和本地进度完整。');
