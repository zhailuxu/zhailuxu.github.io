import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../rule-switch-station.html',import.meta.url),'utf8');
const paradise=fs.readFileSync(new URL('../game-paradise.html',import.meta.url),'utf8');
const roadmap=fs.readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const sources=fs.readFileSync(new URL('../CONTENT_SOURCES.md',import.meta.url),'utf8');
const match=html.match(/\(function\(\)\{'use strict';[\s\S]*?\n\}\)\(\);/);
assert.ok(match,'找不到规则切换分类站主脚本');
const window={};
vm.runInContext(match[0],vm.createContext({window,Math,console}),{filename:'rule-switch-station.html'});
const api=window.RuleSwitchStation;
assert.ok(api,'规则切换分类站测试接口没有初始化');

let generated=0;
for(const [level,cfg] of Object.entries(api.CONFIG)){
  for(let i=0;i<1000;i++){
    const round=api.generateRound(level);generated++;
    assert.equal(round.items.length,cfg.count,`${level} 卡片数量错误`);
    assert.equal(round.schedule.length,cfg.count,`${level} 规则序列长度错误`);
    assert.ok(round.schedule.every(rule=>cfg.rules.includes(rule)),`${level} 出现未开放规则`);
    const expectedSwitches=level==='easy'?0:level==='medium'?1:4;
    assert.equal(api.countSwitches(round.schedule),expectedSwitches,`${level} 规则切换次数错误`);
    round.items.forEach((item,index)=>{
      assert.ok(['blue','orange'].includes(item.color),'出现无效颜色');
      assert.ok(['circle','square'].includes(item.shape),'出现无效形状');
      assert.ok(['small','large'].includes(item.size),'出现无效大小');
      assert.ok(item.quantity>=1&&item.quantity<=4,'数量超出1～4');
      assert.ok(['left','right'].includes(api.classify(item,round.schedule[index])),'分类结果无效');
      assert.ok(api.describe(item).includes(`${item.quantity}个`),'卡片说明缺少数量');
    });
  }
}
const probes=[
  [{color:'blue',shape:'square',size:'large',quantity:4},['left','right','right','right']],
  [{color:'orange',shape:'circle',size:'small',quantity:1},['right','left','left','left']]
];
for(const [item,answers] of probes)['color','shape','size','quantity'].forEach((rule,index)=>assert.equal(api.classify(item,rule),answers[index],`${rule} 分类判定错误`));
assert.ok(paradise.includes('href="rule-switch-station.html"'),'游戏乐园缺少规则切换分类站入口');
assert.ok(paradise.includes('30 个游戏'),'游戏乐园数量没有同步最新游戏总数');
assert.ok(roadmap.includes('**规则切换分类站（第一版）**'),'路线图没有标记规则切换分类站完成');
assert.ok(roadmap.includes('**天平推理（第一版）**'),'路线图没有标记天平推理完成');
assert.ok(sources.includes('`rule-switch-station.html` 规则切换分类站'),'内容来源没有登记规则切换分类站');
assert.ok(html.includes('data-sound-standard="speech"'),'缺少声音能力标记');
assert.ok(html.includes('<script src="hpx-core.js"></script>'),'没有接入公共语音层');
assert.ok(html.includes('id="speakToggle"'),'缺少声音开关');
console.log(`规则切换分类站检查通过：${generated}组随机关卡的属性、分类答案和规则切换节奏全部正确。`);
