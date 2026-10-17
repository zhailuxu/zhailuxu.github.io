import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../hanzi.html', import.meta.url), 'utf8');

assert.ok(html.includes('onclick="startRadicals()"'), '首页缺少偏旁学习入口');
assert.ok(html.includes('id="pgRadical"'), '缺少偏旁学习页面');
assert.ok(html.includes('偏旁和部首不完全一样'), '缺少偏旁与部首区别说明');
assert.ok(html.includes('href="hanzi-components.html"'), '缺少汉字部件拼装的后续练习入口');
assert.ok(html.includes('onclick="speakRadicalExamples(false)"'), '缺少例字依次朗读按钮');
assert.ok(html.includes('hanziSpeech.sequence(items'), '例字没有使用连续朗读队列');
assert.match(html, /if \(announce\) speakRadicalExamples\(true\)/, '切换偏旁时没有自动朗读例字');
assert.ok(html.includes('id="radicalMeaningSection"'), '“它常表示什么”区域缺少移动端滚动目标');
assert.match(html, /button\.onclick = \(\) => selectRadical\(index, true, true\)/, '点击偏旁后没有请求移动端自动定位');
assert.match(html, /function scrollToRadicalMeaning\(\)[\s\S]*?max-width: 620px[\s\S]*?prefers-reduced-motion: reduce[\s\S]*?scrollIntoView\(\{[\s\S]*?block: 'start'/, '移动端没有滚动到偏旁含义区域或未兼容减少动态效果');
assert.ok(html.includes('hpx-core.js?v=20260906-3'), 'hpx-core.js 缺少缓存版本号');
assert.ok(html.includes("typeof hanziSpeech.isAvailable==='function'"), '缺少旧版语音组件兼容处理');
assert.ok(!html.includes("navigator.serviceWorker.register('/sw.js')"), '不应注册线上不存在的 Service Worker');

const dataStart = html.indexOf('const RADICALS = [');
const dataEnd = html.indexOf('\n];', dataStart);
assert.ok(dataStart >= 0 && dataEnd > dataStart, '找不到偏旁学习数据');
const dataSource = html.slice(dataStart, dataEnd + 3)
  .replace('const RADICALS =', 'RADICALS =');
const context = {};
vm.runInNewContext(dataSource, context);
const radicals = context.RADICALS;

assert.equal(radicals.length, 21, '常见偏旁数量不正确');
assert.equal(new Set(radicals.map(item => `${item.glyph}:${item.name}`)).size, radicals.length, '偏旁名称重复');

for (const radical of radicals) {
  assert.ok(radical.glyph && radical.name && radical.pinyin, '偏旁基本信息不完整');
  assert.ok(radical.meaning.length >= 12, `${radical.name}的含义说明过短`);
  assert.ok(radical.examples.length >= 6, `${radical.name}的例字不足`);
  assert.ok(radical.builds.length >= 2, `${radical.name}的组合示例不足`);
  for (const build of radical.builds) {
    assert.equal(build.length, 3, `${radical.name}的组合数据格式错误`);
    assert.ok(radical.examples.includes(build[2]), `${radical.name}的组合结果没有出现在例字中：${build[2]}`);
  }
}

const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match => match[1])
  .filter(Boolean);
for (const source of inlineScripts) new vm.Script(source);

console.log(`偏旁学习检查通过：${radicals.length}组偏旁均包含含义、例字和组合示例。`);
