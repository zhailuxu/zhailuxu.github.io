import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../balance-reasoning.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const roadmap=fs.readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n\}\)\(\);/);
assert.ok(match,'找不到天平推理主脚本');
const window={};
vm.runInContext(match[0],vm.createContext({window,Math,console}),{filename:'balance-reasoning.html'});
const api=window.BalanceReasoning;
assert.ok(api,'天平推理测试接口没有初始化');

let generated=0;
for(const level of Object.keys(api.CONFIG)){
  for(let i=0;i<1000;i++){
    const round=api.generateRound(level);generated++;
    assert.equal(round.level,level,`${level} 题目难度错误`);
    assert.ok(round.options.some(option=>String(option.value)===String(round.answer)),`${level} 选项缺少正确答案`);
    assert.equal(new Set(round.options.map(option=>String(option.value))).size,round.options.length,`${level} 选项重复`);
    assert.equal(api.evaluate(round,round.answer),true,`${level} 正确答案被拒绝`);
    const wrong=round.options.find(option=>String(option.value)!==String(round.answer));
    assert.equal(api.evaluate(round,wrong.value),false,`${level} 错误答案被接受`);
    assert.ok(round.explanation.length>10,`${level} 缺少完整解释`);
    if(level==='easy'){
      assert.equal(round.facts.length,1,'低年级应只有一次直接比较');
      assert.equal(round.options.length,3,'低年级应有三个选项');
      assert.notEqual(round.facts[0].left.key,round.facts[0].right.key,'直接比较出现同一物品');
    }
    if(level==='medium'){
      assert.equal(round.facts.length,2,'中年级应有两次比较');
      assert.equal(new Set(round.objects.map(object=>object.key)).size,3,'传递比较未使用三个不同物品');
      assert.equal(round.options.length,3,'传递比较应有三个物品选项');
    }
    if(level==='hard'){
      assert.ok(round.ratio>=2&&round.ratio<=4,'代换份数超出2～4');
      assert.equal(round.total,round.ratio*round.unit,'等量代换总重量计算错误');
      assert.ok([100,200,250,500].includes(round.unit),'小方块单位重量无效');
      assert.equal(round.options.length,4,'等量代换应有四个重量选项');
      assert.ok(round.options.every(option=>/克/.test(option.label)),'重量选项没有标明克');
      if(round.total>=1000)assert.ok(api.formatWeight(round.total).includes('千克'),'达到1000克时没有衔接千克');
    }
  }
}
assert.equal(api.formatWeight(1000),'1000克（1千克）','1000克换算显示错误');
assert.equal(api.formatWeight(1500),'1500克（1.5千克）','1500克换算显示错误');
assert.ok(paradise.includes('href="balance-reasoning.html"'),'游戏乐园缺少天平推理入口');
assert.ok(paradise.includes('30 个游戏'),'游戏乐园数量没有同步最新游戏总数');
assert.ok(roadmap.includes('**天平推理（第一版）**'),'路线图没有标记天平推理完成');
assert.ok(roadmap.includes('**图形装箱（第一版）**'),'路线图没有标记图形装箱完成');
assert.ok(sources.includes('`balance-reasoning.html` 天平推理'),'内容来源没有登记天平推理');
assert.ok(html.includes('data-sound-standard="speech"'),'缺少声音能力标记');
assert.ok(html.includes('<script src="hpx-core.js"></script>'),'没有接入公共语音层');
assert.ok(html.includes('id="speakToggle"'),'缺少声音开关');
console.log(`天平推理检查通过：${generated}组随机题的直接比较、传递关系、等量代换和单位换算全部正确。`);
