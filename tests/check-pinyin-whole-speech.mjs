import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../pinyin.html', import.meta.url), 'utf8');
const match = html.match(/function speakWhole\([\s\S]*?\n}\nfunction renderWhole/);

assert.ok(match, '没有找到整体认读音节卡片朗读函数');
assert.ok(!match[0].includes("text:'整体认读音节'"), '每张卡片朗读前仍会重复栏目名称');
assert.ok(html.includes("const READING_MODES={initial:'full',final:'full',whole:'full'}"), '整体认读音节没有默认使用示例连读模式');
assert.ok(html.includes('data-read-kind="whole" data-read-mode="single"') && html.includes('>只读整体认读音节</button>'), '缺少只读整体认读音节开关');
assert.ok(html.includes('data-read-kind="whole" data-read-mode="full"') && html.includes('>示例连读</button>'), '缺少整体认读音节示例连读开关');
assert.ok(match[0].includes("if(READING_MODES.whole==='single')"), '只读模式没有接入卡片朗读函数');
assert.ok(match[0].includes('speak(read);'), '只读模式没有单独播放音节读音');
assert.ok(match[0].includes('{text:read,gapMs:280}'), '卡片朗读缺少带调读音');
assert.ok(match[0].includes('{text:word}'), '卡片朗读缺少例词');

console.log('整体认读音节朗读检查通过：只读音节和示例连读模式完整。');
