import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const vocabularySource=fs.readFileSync(new URL('../english-vocabulary.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../english.html',import.meta.url),'utf8');
const context={window:{}};
vm.runInNewContext(vocabularySource,context,{filename:'english-vocabulary.js'});

const groups=context.window.GRADE_WORDS;
assert.deepEqual(Object.keys(groups),['grade1','grade2','grade3','grade4','grade5','grade6'],'词库必须覆盖一至六年级');

const all=Object.values(groups).flat();
for(const [grade,items] of Object.entries(groups)){
  assert.ok(items.length>=60,`${grade} 的词汇少于 60 个`);
  for(const item of items){
    assert.ok(item.word&&item.cn&&item.emoji,`${grade} 存在缺少英文、中文或配图的词条`);
    assert.equal(item.grade,Number(grade.slice(-1)),`${item.word} 的年级标记不正确`);
  }
}

const normalized=all.map(item=>item.word.toLowerCase());
assert.equal(new Set(normalized).size,normalized.length,'跨年级词库存在重复单词');
assert.ok(html.includes('<script src="english-vocabulary.js"></script>'),'英语页面没有加载分级词库');
assert.ok(html.includes("let matchCat     = 'grade1'"),'单词配图没有默认使用一年级词库');
assert.ok(html.includes("matchCat === 'all' ? ALL_WORDS : WORDS[matchCat]"),'单词配图缺少全部词汇模式');
for(let grade=1;grade<=6;grade++){
  assert.ok(html.includes(`value="grade${grade}"`),`拼写闯关缺少 ${grade} 年级选项`);
}

console.log(`英语分级词库检查通过：1–6 年级共 ${all.length} 个词，均含中文释义、Unicode 配图和年级标记。`);
