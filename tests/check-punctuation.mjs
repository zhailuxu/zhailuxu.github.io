import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../punctuation.html',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const roadmap=fs.readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');

for(const [position,match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()){
  if(match[1].trim())new vm.Script(match[1],{filename:`punctuation.html#inline-${position+1}`});
}

const dataStart=html.indexOf('const PUNCT=[');
const dataEnd=html.indexOf('let activeLevel=',dataStart);
assert.ok(dataStart>0&&dataEnd>dataStart,'找不到标点符号学习数据');
const context={};
vm.runInNewContext(html.slice(dataStart,dataEnd)+'\nglobalThis.data={PUNCT,QUIZ,CHALLENGES};',context);
const {PUNCT,QUIZ,CHALLENGES}=context.data;

assert.equal(PUNCT.length,12,'应覆盖12种小学常用标点');
assert.deepEqual(Array.from(new Set(PUNCT.map(item=>item.level))),['low','mid','high'],'标点分级不完整');
assert.ok(PUNCT.every(item=>item.symbol&&item.name&&item.use&&item.example&&item.grade),'标点卡缺少名称、用法、例句或年级');
assert.match(html,/class="example-chip" data-example-id="\$\{item\.id\}"/,'每张标点卡应包含例句标签');
assert.match(html,/id="exampleToast" role="status" aria-live="polite"/,'缺少可访问的例句 Toast');
assert.match(html,/function renderFocusedExample\(item\)[\s\S]*?item\.symbol\.trim\(\)\.split\(\/\\s\+\/\)[\s\S]*?createElement\('mark'\)[\s\S]*?example-focus/,'例句没有高亮当前学习的标点');
assert.match(html,/@keyframes example-blink\{0%,100%\{opacity:1\}20%,60%\{opacity:\.45\}40%,80%\{opacity:1\}\}/,'目标标点缺少柔和的原位闪烁提示');
assert.match(html,/animation:example-blink 1\.4s ease-out both/,'目标标点闪烁时长应为1.4秒');
assert.ok(!html.includes('@keyframes example-jump-blink'),'目标标点仍在使用上下移动动画');
assert.match(html,/\.example-focus\{[^}]*background:transparent[^}]*box-shadow:none/,'目标标点仍带有底框或阴影');
assert.match(html,/function showExample\(id,anchor,options\)[\s\S]*?请注意：\$\{item\.name\}[\s\S]*?renderFocusedExample\(item\)/,'Toast 没有提示当前学习的标点名称和符号');
assert.match(html,/function showExample\(id,anchor,options\)[\s\S]*?getBoundingClientRect\(\)[\s\S]*?rect\.top-10/,'例句 Toast 没有定位到当前标点卡上方');
assert.match(html,/function showExample\(id,anchor,options\)[\s\S]*?options\.read!==false[\s\S]*?say\(`例句。\$\{item\.example\}`\)/,'手动展示例句后没有提示“例句”并自动朗读');
assert.match(html,/function showDetail\(id\)[\s\S]*?speech\.sequence\([\s\S]*?text:'例句'[\s\S]*?text:item\.example[\s\S]*?index!==2[\s\S]*?showExample\(id,anchor,\{read:false\}\)/,'方格用法读完后没有只提示“例句”，再自动展示并朗读内容');
assert.ok(!html.includes('例句，请注意${item.name}'),'Toast 前不应朗读“请注意某某符号”');
assert.ok(html.includes('<script src="hpx-footer-actions.js"></script>'),'页面缺少公共页脚操作脚本');
for(const item of PUNCT){
  const marks=item.symbol.trim().split(/\s+/);
  assert.ok(marks.every(mark=>item.example.includes(mark)),`${item.name}例句中找不到需要高亮的目标标点`);
}
assert.ok(QUIZ.length>=16,'选择练习题量不足');
assert.ok(CHALLENGES.length>=7,'综合闯关题量不足');

const known=new Set(PUNCT.map(item=>item.symbol));
for(const item of QUIZ){
  assert.ok(item.text.includes('___'),'选择练习缺少待填空格');
  assert.ok(known.has(item.answer),'选择练习答案不在标点表中');
  assert.ok(item.why,'选择练习缺少解析');
}
for(const item of CHALLENGES){
  assert.equal(item.parts.length,item.answers.length+1,'综合闯关的句子分段与答案数量不一致');
  assert.ok(item.answers.every(answer=>item.choices.includes(answer)),'综合闯关选项未包含全部答案');
}

assert.ok(index.includes('href="punctuation.html"')&&index.includes('data-grades="1,2,3,4,5,6"'),'首页缺少一至六年级标点课程入口');
assert.ok(roadmap.includes('标点符号学习与练习'),'路线图没有登记标点课程完成');
assert.ok(sources.includes('`punctuation.html` 标点符号小课堂'),'内容来源没有登记标点课程');
assert.ok(!html.match(/<img|<audio|\.mp3|\.wav|@font-face/),'标点课程不应引入外部图片、字体或录音');

console.log(`标点符号课程检查通过：${PUNCT.length}种标点、${QUIZ.length}道选择题、${CHALLENGES.length}组综合闯关均有效。`);
