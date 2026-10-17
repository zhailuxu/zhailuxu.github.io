import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../pinyin-listening.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const roadmap=fs.readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n\}\)\(\);/);
assert.ok(match,'找不到拼音听辨挑战主脚本');
const window={};
vm.runInContext(match[0],vm.createContext({window,Math,console}),{filename:'pinyin-listening.html'});
const api=window.PinyinListening;
assert.ok(api,'拼音听辨挑战测试接口没有初始化');
assert.equal(api.INITIALS.length,23,'声母资料应为23个');
assert.ok(api.FINALS.length>=16,'韵母听辨资料不足');
assert.ok(api.CONFUSABLE.some(group=>group.focus==='四声'),'困难题缺少声调听辨');
assert.ok(api.CONFUSABLE.some(group=>group.focus==='前鼻音和后鼻音'),'困难题缺少前后鼻音听辨');
assert.ok(api.CONFUSABLE.some(group=>group.focus==='平舌音和翘舌音'),'困难题缺少平翘舌听辨');

let generated=0;
for(const [level,cfg] of Object.entries(api.CONFIG))for(let i=0;i<1000;i++){
  const question=api.generateQuestion(level);generated++;
  assert.equal(question.type,cfg.type,`${level}题型错误`);
  assert.equal(question.options.length,cfg.count,`${level}选项数量错误`);
  assert.equal(new Set(question.options.map(option=>option.value)).size,cfg.count,`${level}选项重复`);
  assert.ok(question.options.some(option=>option.value===question.correct),`${level}正确答案不在选项中`);
  assert.ok(question.speech.length>0,`${level}缺少朗读内容`);
  assert.equal(api.isValidQuestion(question),true,`${level}题目校验失败`);
  if(level==='hard')assert.ok(question.options.every(option=>option.sub),'困难题选项缺少对应汉字');
}

assert.ok(html.includes('data-sound-standard="speech"'),'缺少声音能力标记');
assert.ok(html.includes('href="hpx-game-mobile.css"'),'没有接入移动端公共层');
assert.ok(html.includes('<script src="hpx-game-progress.js"></script>'),'没有接入成长记录');
assert.ok(!html.match(/<audio|\.mp3|\.wav/),'不应引入外部录音文件');
assert.ok(paradise.includes('href="pinyin-listening.html"'),'游戏乐园缺少拼音听辨挑战入口');
assert.ok(paradise.includes('30 个游戏'),'游戏乐园数量没有更新为30');
assert.ok(roadmap.includes('**拼音听辨挑战（第一版）**'),'路线图没有标记拼音听辨挑战完成');
assert.ok(sources.includes('`pinyin-listening.html` 拼音听辨挑战'),'内容来源没有登记拼音听辨挑战');
console.log(`拼音听辨挑战检查通过：${generated}道声母、韵母、声调和易混音随机题均有效。`);
