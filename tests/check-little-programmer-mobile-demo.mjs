import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../little-programmer-mobile-demo.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');

assert.ok(html.includes('小小程序员·移动操作台演示'),'演示页标题未区分正式版');
assert.ok(html.includes('class="card setup-card" open'),'演示页缺少可折叠设置区');
assert.ok(html.includes('class="card workspace mobile-console"'),'演示页缺少移动操作台容器');
assert.ok(html.includes('position:sticky;top:0'),'演示页地图没有吸顶');
assert.ok(html.includes('class="mobile-command-dock"'),'演示页缺少底部指令台');
assert.ok(html.includes('flex-wrap:nowrap;overflow-x:auto'),'程序轨道不能横向滑动');
assert.ok(html.includes('grid-template-columns:minmax(220px,.9fr) minmax(300px,1.1fr)!important'),'600px以上没有恢复左右双栏');
assert.ok(html.includes('href="hpx-game-mobile.css"'),'演示页没有接入移动端公共层');
assert.ok(html.includes('hpx-game-progress.js'),'演示页没有保留成长记录');
assert.ok(!paradise.includes('little-programmer-mobile-demo.html'),'演示页不应提前加入游戏乐园');
assert.ok(sources.includes('`little-programmer-mobile-demo.html` 小小程序员移动操作台演示'),'内容来源未登记演示页');
console.log('小小程序员移动演示检查通过：折叠设置、吸顶地图、横向程序轨道、底部指令台和横屏双栏完整。');
