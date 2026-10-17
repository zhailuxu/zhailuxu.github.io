import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const home = fs.readFileSync(new URL('index.html', root), 'utf8');

assert.ok(!home.includes('<section class="training-camp"'), '首页仍然展示训练营模块');
assert.ok(!home.includes('href="daily-camp.html"'), '首页仍然保留训练营入口');
assert.ok(!home.includes('<script src="hpx-daily-camp.js"></script>'), '首页仍然加载训练营数据层');
assert.ok(!home.includes('<script src="hpx-game-progress.js"></script>'), '首页仍然为已移除的训练营加载成长记录层');
assert.ok(!home.includes('renderTrainingCamp'), '首页仍然包含训练营渲染逻辑');
assert.ok(!home.includes('.training-camp'), '首页仍然包含训练营专用样式');

console.log('首页训练营移除检查通过：界面、入口、样式和专用脚本均未残留。');
