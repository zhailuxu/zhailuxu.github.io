import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../english.html',import.meta.url),'utf8');
for(const [index,match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()){
  if(match[1].trim())new vm.Script(match[1],{filename:`english.html#inline-${index+1}`});
}
const dataSource=html.slice(html.indexOf('const NUMBERS_1_20'),html.indexOf('const WORDS'));
const context={};
vm.runInNewContext(dataSource+'\nglobalThis.items=NUMBERS_1_20;',context);
const expected=['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];

assert.equal(context.items.length,20,'数字学习区必须正好覆盖1到20');
assert.deepEqual(Array.from(context.items,item=>item.number),Array.from({length:20},(_,index)=>index+1),'数字顺序不是1到20');
assert.deepEqual(Array.from(context.items,item=>item.word),expected,'1到20英文拼写不完整或顺序错误');
assert.ok(html.includes("switchTab('numbers')")&&html.includes('id="tab-numbers"'),'页面缺少数字1到20入口或面板');
assert.ok(html.includes('function speakAllNumbers()'),'页面缺少1到20顺序朗读');
assert.ok(html.includes("numberDirection=Math.random()<.5?'toWord':'toNumber'"),'数字检查没有覆盖双向题型');
assert.ok(html.includes('function checkNumber(button,number)'),'数字检查缺少答案判定');

const alphaStart=html.indexOf("let alphaReadingMode='full'");
const alphaEnd=html.indexOf('//  TAB 2 — NUMBERS',alphaStart);
const alphaContext={};
vm.runInNewContext(html.slice(alphaStart,alphaEnd)+"\nglobalThis.readAlpha=alphaSpeechText;globalThis.setAlphaModeForTest=mode=>{alphaReadingMode=mode;};",alphaContext);
assert.equal(alphaContext.readAlpha({l:'A',word:'apple'}),'A. apple.','默认示例连读没有按字母加例词播放');
alphaContext.setAlphaModeForTest('letter');
assert.equal(alphaContext.readAlpha({l:'A',word:'apple'}),'a','只读字母模式应使用小写语音文本，避免朗读 capital A');
assert.equal(alphaContext.readAlpha({l:'B',word:'ball'}),'b','只读字母模式应直接朗读 B，不添加 capital');
assert.ok(html.includes('>只读字母</button>')&&html.includes('>示例连读</button>'),'字母表缺少两种朗读模式开关');

console.log('英语练习检查通过：字母单读/示例连读，以及1到20卡片、顺序朗读、双向随机检查和计分反馈完整。');
