import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const plans = {
  math: 'study-plan.html',
  chinese: 'chinese-study-plan.html',
  english: 'english-study-plan.html'
};

// 新课程页应先加入首页。若它不适合出现在学科学习地图中，必须在这里登记并说明原因。
const reviewedExclusions = new Map([
  ['study-plan.html', '数学学习地图本身'],
  ['chinese-study-plan.html', '语文学习地图本身'],
  ['english-study-plan.html', '英语学习地图本身'],
  ['overview-review-plan.html', '跨学科复习导航'],
  ['mindset-habits-plan.html', '跨学科学习习惯导航'],
  ['homework_check.html', '跨学科作业工具，不对应单一知识点'],
  ['homework_checkv2.html', '跨学科作业工具，不对应单一知识点']
]);

function attributes(source) {
  return new Map([...source.matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
}

const cards = [...indexHtml.matchAll(/<a\b([^>]*)>/g)]
  .map(match => attributes(match[1]))
  .filter(attrs => (attrs.get('class') || '').split(/\s+/).includes('card'))
  .map(attrs => ({
    href: attrs.get('href'),
    subjects: (attrs.get('data-subject') || '').split(',').filter(Boolean)
  }))
  .filter(card => card.href && card.subjects.length);

for (const [subject, planFile] of Object.entries(plans)) {
  const planHtml = fs.readFileSync(path.join(root, planFile), 'utf8');
  const planLinks = new Set([...planHtml.matchAll(/class="study-link" href="([^"]+\.html)"/g)]
    .map(match => match[1]));

  for (const page of planLinks) {
    assert.ok(fs.existsSync(path.join(root, page)), `${planFile} 的链接目标不存在：${page}`);
  }

  const missing = cards
    .filter(card => card.subjects.includes(subject))
    .map(card => card.href)
    .filter(page => !planLinks.has(page) && !reviewedExclusions.has(page));

  assert.deepEqual(missing, [], `${planFile} 尚未评估这些首页课程页：${missing.join('、')}`);

  for (let grade = 1; grade <= 6; grade += 1) {
    const start = planHtml.indexOf(`<section id="g${grade}">`);
    const end = planHtml.indexOf('</section>', start);
    assert.ok(start >= 0 && end > start, `${planFile} 缺少${grade}年级区块`);
    assert.match(planHtml.slice(start, end), /class="study-link"/, `${planFile} 的${grade}年级没有学习入口`);
  }

  console.log(`${planFile}：${planLinks.size} 个配套页面已覆盖首页课程卡片。`);
}

for (const [page] of reviewedExclusions) {
  assert.ok(cards.some(card => card.href === page), `无需加入学习地图的登记已过期：${page}`);
}

console.log('三科学习地图覆盖检查通过。');
