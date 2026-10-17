import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('pinyin.html', root), 'utf8');
const sources = fs.readFileSync(new URL('CONTENT_SOURCES.md', root), 'utf8');

function extract(pattern, label) {
  const match = html.match(pattern);
  assert.ok(match, `没有找到${label}数据`);
  return match[0];
}

const dataSource = [
  extract(/const INITIALS=\[[\s\S]*?\n\];/, '声母'),
  extract(/const FINAL_GROUPS=\[[\s\S]*?\n\];/, '韵母'),
  extract(/const WHOLE_SYLLABLES=\[[\s\S]*?\n\];/, '整体认读音节')
].join('\n').replaceAll('const ', 'var ');
const context = {};
vm.runInNewContext(`${dataSource}\nglobalThis.counts={initial:INITIALS.length,final:FINAL_GROUPS.flatMap(group=>group.items).length,whole:WHOLE_SYLLABLES.length};`, context);

assert.deepEqual(JSON.parse(JSON.stringify(context.counts)), {initial:23, final:24, whole:16}, '拼读学习基础数据数量不完整');
assert.ok(html.includes("switchTab('study')") && html.includes('id="tab-study"'), '页面缺少拼读学习页签');
assert.ok(html.includes('>全部 63</button>') && html.includes('>声母 23</button>') && html.includes('>韵母 24</button>') && html.includes('>整体认读 16</button>'), '拼读学习缺少完整的范围选择');
assert.ok(html.includes('function getAllStudyItems()') && html.includes('return [...initials,...finals,...wholes]'), '拼读学习没有合并三类完整数据');
assert.ok(html.includes("whole:'整体认读音节直接读，不拆成声母和韵母。'"), '整体认读音节没有提示直接认读');
assert.ok(html.includes('function speakCurrentStudy()') && html.includes('function moveStudy(step)'), '拼读学习缺少逐项朗读或前后导航');
assert.ok(html.includes('role="progressbar"') && html.includes("meter.setAttribute('aria-valuenow'"), '拼读学习进度缺少动态无障碍语义');
assert.ok(sources.includes('覆盖23个声母、24个韵母和16个整体认读音节的63项顺序学习环节'), '内容来源没有登记完整拼读学习环节');

console.log('拼读学习检查通过：23个声母、24个韵母、16个整体认读音节及63项导航完整。');
