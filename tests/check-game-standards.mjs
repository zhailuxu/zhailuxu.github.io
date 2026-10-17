import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('../',import.meta.url);
const paradise=fs.readFileSync(new URL('game-paradise.html',root),'utf8');
const tieredGames=['bead-memory','mirror-puzzle','pixel-difference','pattern-sequence','route-memory','block-rotation','color-code','schulte-grid','instruction-challenge','reaction-control','number-maze','hanzi-components','little-programmer','rhythm-echo','quantity-flash','rule-switch-station','balance-reasoning','shape-packing','shape-sudoku','block-escape','probability-lab','clue-detective','time-planner','pinyin-listening','coordinate-treasure','arithmetic-blocks','money-shop','story-order'];

assert.ok(paradise.includes('class="difficulty-guide"'),'游戏乐园缺少统一难度说明');
assert.ok(paradise.includes('低年级 · 先理解玩法'),'缺少低年级难度定义');
assert.ok(paradise.includes('中年级 · 增加信息量'),'缺少中年级难度定义');
assert.ok(paradise.includes('高年级 · 处理复合规则'),'缺少高年级难度定义');
assert.ok(paradise.includes('不代表孩子必须按年龄选择'),'缺少避免年龄标签压力的说明');

for(const name of tieredGames){
  const file=`${name}.html`,html=fs.readFileSync(new URL(file,root),'utf8');
  assert.ok(paradise.includes(`href="${file}"`),`游戏乐园缺少${file}入口`);
  assert.ok(html.includes('name="viewport"'),`${file}缺少移动端视口`);
  assert.ok(html.includes('data-level="easy"'),`${file}缺少低年级入口`);
  assert.ok(html.includes('data-level="medium"'),`${file}缺少中年级入口`);
  assert.ok(html.includes('data-level="hard"'),`${file}缺少高年级入口`);
  assert.ok(html.includes('prefers-reduced-motion'),`${file}缺少减弱动画支持`);
}

// 从 quantity-flash 起，后续追加到列表的新游戏都必须声明并实现可关闭的声音能力。
const soundStandardStart=tieredGames.indexOf('quantity-flash');
for(const name of tieredGames.slice(soundStandardStart)){
  const file=`${name}.html`,html=fs.readFileSync(new URL(file,root),'utf8');
  assert.match(html,/data-sound-standard="(?:speech|webaudio)"/,`${file}缺少声音能力标记`);
  assert.match(html,/id="(?:speak|sound|audio)Toggle"/,`${file}缺少可关闭的声音按钮`);
  assert.ok(html.includes('hpx-core.js')||/AudioContext|webkitAudioContext/.test(html),`${file}缺少声音实现`);
}

console.log(`统一游戏检查通过：${tieredGames.length}个关卡型游戏具备三级难度、移动端视口和减弱动画支持，数量闪视及后续游戏具备可关闭声音。`);
