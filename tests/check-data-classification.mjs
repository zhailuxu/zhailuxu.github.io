import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../data-classification.html',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const roadmap=fs.readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n\}\)\(\);/);
assert.ok(match,'找不到分类统计主脚本');
const window={};
vm.runInContext(match[0],vm.createContext({window,Math,console}),{filename:'data-classification.html'});
const api=window.DataClassification;
assert.ok(api,'分类统计测试接口没有初始化');
assert.equal(api.categoryPositionSpeech({rule:'color',categories:[{name:'蓝色'},{name:'黄色'}]}),'请按颜色分类。左侧是蓝色，右侧是黄色。','两个分类盒没有按左右位置播报');
assert.equal(api.categoryPositionSpeech({rule:'shape',categories:[{name:'圆形'},{name:'正方形'},{name:'三角形'}]}),'请按形状分类。左侧是圆形，中间是正方形，右侧是三角形。','三个分类盒没有播报左中右位置');
assert.equal(api.questionSpeech({text:'哪种颜色的卡片最多？',options:['蓝色','黄色']}),'分类完成。哪种颜色的卡片最多？选择项：选项1，蓝色；选项2，黄色。','统计题没有连同选择项一起播报');

let generated=0;
for(const [level,cfg] of Object.entries(api.CONFIG)){
  for(let i=0;i<1000;i++){
    const round=api.generateRound(level);generated++;
    assert.equal(round.categories.length,cfg.categories,`${level} 分类数量错误`);
    assert.equal(round.items.length,cfg.count,`${level} 卡片数量错误`);
    assert.ok(['color','shape'].includes(round.rule),`${level} 分类规则无效`);
    const allowed=new Set(round.categories.map(cat=>cat.key));
    round.items.forEach(item=>assert.ok(allowed.has(item[round.rule].key),`${level} 出现无法归类的卡片`));
    const counts=api.summarize(round);
    assert.equal(Object.values(counts).reduce((sum,n)=>sum+n,0),cfg.count,`${level} 统计总数错误`);
    assert.ok(Object.values(counts).every(n=>n>0),`${level} 出现空分类`);
    assert.equal(new Set(Object.values(counts)).size,Object.values(counts).length,`${level} 数量分布存在并列，最多最少会产生歧义`);
    const question=api.createQuestion(round,counts);
    assert.ok(question.options.map(String).includes(String(question.answer)),`${level} 问题选项缺少正确答案`);
    assert.ok(question.options.length>=2,`${level} 问题有效选项不足`);
    assert.equal(new Set(question.options.map(String)).size,question.options.length,`${level} 问题出现重复选项`);
  }
}
assert.ok(index.includes('href="data-classification.html"'),'首页缺少分类统计入口');
assert.ok(roadmap.includes('`data-classification.html`'),'路线图缺少分类统计完成记录');
assert.ok(sources.includes('`data-classification.html` 分类统计小调查'),'内容来源未登记分类统计页面');
assert.ok(html.includes('@media(prefers-reduced-motion:reduce)'),'缺少减弱动画支持');
assert.ok(html.includes("say(categoryPositionSpeech(round))"),'新一轮没有自动播报分类盒位置');
assert.ok(html.includes("say(questionSpeech(state.question))"),'分类完成后没有自动播报题目和选择项');
assert.ok(html.includes('id="readBinsBtn"')&&html.includes("categoryPositionSpeech(state.round)"),'缺少手动重听分类盒按钮');
assert.ok(html.includes('id="speakToggle"')&&html.includes('data-sound-standard="speech"'),'缺少声音开关或语音能力标记');
console.log(`分类统计检查通过：${generated}组随机分类的类别、数量、统计汇总和读表问题全部正确。`);
