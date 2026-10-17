import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('../',import.meta.url);
const games=['pinball','beads','bead-memory','mirror-puzzle','pixel-difference','pattern-sequence','route-memory','block-rotation','color-code','schulte-grid','instruction-challenge','reaction-control','number-maze','hanzi-components','little-programmer','rhythm-echo','quantity-flash','rule-switch-station','balance-reasoning','shape-packing','shape-sudoku','block-escape','probability-lab','clue-detective','time-planner','pinyin-listening','coordinate-treasure','arithmetic-blocks','money-shop','story-order'];
const mobile=fs.readFileSync(new URL('hpx-game-mobile.css',root),'utf8');
const roadmap=fs.readFileSync(new URL('ROADMAP.md',root),'utf8');
const sources=fs.readFileSync(new URL('CONTENT_SOURCES.md',root),'utf8');

assert.ok(mobile.includes('min-height:44px'),'公共移动层缺少44px触控目标');
assert.ok(mobile.includes('touch-action:manipulation'),'公共移动层缺少点击防误触');
assert.ok(mobile.includes('safe-area-inset-bottom'),'公共移动层缺少底部安全区');
assert.ok(mobile.includes('-webkit-overflow-scrolling:touch'),'公共移动层缺少工具栏惯性滚动');
assert.ok(mobile.includes('-webkit-text-size-adjust:100%'),'公共移动层缺少文本缩放稳定规则');
assert.ok(mobile.includes('@media(max-width:700px) and (hover:none)'),'公共移动层缺少窄屏无悬停设备规则');
assert.ok(mobile.includes('prefers-reduced-motion'),'公共移动层缺少减少动画规则');
assert.match(mobile,/^\/\*[^]*?\*\/\s*@media\(max-width:700px\)\{/,'公共移动层存在会改动桌面布局的全局样式');
assert.ok(!mobile.includes('(pointer:coarse)'),'公共移动层不能让宽屏触控设备强制使用手机布局');
assert.ok(mobile.includes('grid-template-columns:minmax(0,1fr)!important'),'公共移动层缺少窄屏强制单列保护');
assert.ok(mobile.includes('.container,.card{min-width:0!important;width:100%!important}'),'公共移动层缺少窄屏容器宽度保护');
assert.ok(mobile.includes('box-sizing:border-box'),'公共移动层缺少容器内边距宽度保护');
assert.ok(mobile.includes('overflow-x:auto'),'公共移动层缺少横向工具栏滚动保护');

for(const name of games){
  const html=fs.readFileSync(new URL(`${name}.html`,root),'utf8');
  assert.ok(html.includes('name="viewport"'),`${name}.html缺少移动端viewport`);
  assert.ok(html.includes('href="hpx-game-mobile.css"'),`${name}.html没有接入公共移动层`);
  assert.ok(html.includes('prefers-reduced-motion')||mobile.includes('prefers-reduced-motion'),`${name}.html缺少减少动画支持`);
  assert.ok(html.includes('hpx-game-progress.js'),`${name}.html移动端没有接入本地成长记录`);
}

for(const name of ['beads','bead-memory','mirror-puzzle']){
  const html=fs.readFileSync(new URL(`${name}.html`,root),'utf8');
  assert.match(html,/pointerdown|touchstart/,`${name}.html拖动交互缺少触摸或Pointer Events入口`);
  assert.match(html,/touch-action\s*:\s*none|preventDefault\(\)/,`${name}.html拖动时没有抑制页面误滚动`);
}

assert.ok(roadmap.includes('**游戏手机端操作专项（第一版）**'),'路线图没有标记手机端专项完成');
assert.ok(sources.includes('`hpx-game-mobile.css` 游戏移动端公共交互层'),'内容来源没有登记移动端公共层');
console.log('游戏手机端检查通过：30个游戏已接入公共触控层，拖动页、44px目标、安全区、横向滚动和减少动画规则完整。');
