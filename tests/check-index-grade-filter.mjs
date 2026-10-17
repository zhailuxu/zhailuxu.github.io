import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.ok(html.includes('data-filter="6"'), '首页缺少六年级筛选按钮');
assert.ok(html.includes("6: ['6']"), '筛选逻辑缺少六年级映射');
assert.ok(html.includes('wantedGrades.some(grade=>grades.includes(grade))'), '筛选逻辑没有按明确年级匹配');
assert.ok(html.includes('function firstApplicableGrade(card)'), '首页缺少课程起始年级计算');
assert.ok(html.includes("if(currentSubjectFilter!=='all')"), '首页没有在单科筛选时启用年级排序');
assert.ok(html.includes('Number(a.dataset.originalOrder) - Number(b.dataset.originalOrder)'), '切回全部学科时不能恢复原始顺序');
assert.match(html,/href="hanzi\.html"[\s\S]*?<\/a>\s*<a class="card" href="pinyin\.html"/,'汉语拼音入门没有紧跟在趣味汉字后面');
assert.match(html,/href="numbers\.html"[\s\S]*?<\/a>\s*<a class="card" href="addsub10\.html"[\s\S]*?<\/a>\s*<a class="card c2" href="carry\.html"[\s\S]*?<\/a>\s*<a class="card c8" href="placevalue\.html"[\s\S]*?<\/a>\s*<a class="card c1" href="multiplication\.html"/,'数学启蒙课程没有按数字、10以内加减法、进位加减法、数位认知、乘法口诀排列');

const gradeSixCards = [...html.matchAll(/<a class="card[^>]*data-grades="([^"]*\b6\b[^"]*)"/g)];
assert.ok(gradeSixCards.length > 0, '首页没有任何六年级内容卡片');

const cards = [...html.matchAll(/<a class="card[^"]*" href="([^"]+)" data-subject="([^"]+)" data-grades="([^"]+)"/g)]
  .map(match=>({
    href:match[1],
    dataset:{subject:match[2],grades:match[3]},
    style:{}
  }));
const originalOrder = cards.map(card=>card.href);
const grid = {
  cards,
  querySelectorAll(selector){ return selector==='.card' ? this.cards : []; },
  appendChild(card){
    this.cards.splice(this.cards.indexOf(card),1);
    this.cards.push(card);
  }
};
const classList = {add(){},remove(){}};
const subjectButtons = ['all','chinese','english','math'].map(subject=>({dataset:{subject},classList}));
const subjectBar = {querySelectorAll(){ return subjectButtons; }};
subjectButtons.forEach(button=>{ button.closest=()=>subjectBar; });
const document = {
  querySelector(selector){ return selector==='.grid' ? grid : null; }
};
const filterScriptStart = html.indexOf("<script>\nlet currentGradeFilter = 'all'");
const filterScriptEnd = html.indexOf('</script>',filterScriptStart);
assert.ok(filterScriptStart>=0 && filterScriptEnd>filterScriptStart,'找不到首页筛选脚本');
const filterScript = html.slice(html.indexOf('\n',filterScriptStart)+1,filterScriptEnd);
const context = {document};
vm.runInNewContext(filterScript,context,{filename:'index-filter.js'});

for(const button of subjectButtons.slice(1)){
  context.filterSubject(button);
  const firstGrades = grid.cards
    .filter(card=>card.style.display!=='none')
    .map(card=>Math.min(...card.dataset.grades.split(',').map(Number).filter(grade=>grade>=1&&grade<=6)));
  assert.deepEqual(firstGrades,[...firstGrades].sort((a,b)=>a-b),`${button.dataset.subject} 内容没有按一至六年级排序`);
}
context.filterSubject(subjectButtons[0]);
assert.deepEqual(grid.cards.map(card=>card.href),originalOrder,'切回全部学科后没有恢复首页原始顺序');

console.log(`首页筛选检查通过：三科内容按一至六年级排序，六年级入口可筛选 ${gradeSixCards.length} 张相关卡片。`);
