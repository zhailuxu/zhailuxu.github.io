import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('hpx-money-shop.js',root),'utf8');
const html=fs.readFileSync(new URL('money-shop.html',root),'utf8');
const paradise=fs.readFileSync(new URL('game-paradise.html',root),'utf8');
const daily=fs.readFileSync(new URL('hpx-daily-camp.js',root),'utf8');
const progress=fs.readFileSync(new URL('hpx-game-progress.js',root),'utf8');
const parent=fs.readFileSync(new URL('hpx-parent-report.js',root),'utf8');
const roadmap=fs.readFileSync(new URL('ROADMAP.md',root),'utf8');
const sources=fs.readFileSync(new URL('CONTENT_SOURCES.md',root),'utf8');
const fraction=fs.readFileSync(new URL('fraction.html',root),'utf8');
const context={globalThis:{},Math};
vm.runInContext(source,vm.createContext(context),{filename:'hpx-money-shop.js'});
const api=context.globalThis.HpxMoneyShop;
assert.ok(api,'货币商店生成器没有初始化');
assert.equal(api.format(105),'1元5分','元角分格式化错误');
assert.equal(api.decompose(3650).reduce((sum,item)=>sum+item.fen,0),3650,'练习币分解金额错误');

let generated=0;
for(const level of ['easy','medium','hard'])for(let i=0;i<1000;i++){
  const puzzle=api.generate(level);generated++;
  assert.equal(puzzle.level,level,`${level}难度标记错误`);
  assert.ok(puzzle.goal>0,`${level}目标金额无效`);
  if(level!=='easy')assert.equal(puzzle.goal%10,0,`${level}金额无法用练习币表示`);
  assert.equal(api.decompose(puzzle.goal).reduce((sum,item)=>sum+item.fen,0),puzzle.goal,`${level}目标金额无法凑出`);
  if(level==='medium')assert.equal(puzzle.items.reduce((sum,item)=>sum+item.price,0),puzzle.goal,'购物篮总价与目标不一致');
  if(level==='hard')assert.equal(puzzle.paid-puzzle.price,puzzle.goal,'找零金额计算错误');
}

assert.ok(html.includes('data-level="easy"')&&html.includes('data-level="medium"')&&html.includes('data-level="hard"'),'货币商店缺少三级难度');
assert.ok(html.includes('data-sound-standard="speech"'),'货币商店缺少声音能力标记');
assert.ok(html.includes('href="hpx-game-mobile.css"'),'货币商店没有接入移动端公共层');
assert.ok(html.includes('<script src="hpx-game-progress.js"></script>'),'货币商店没有接入成长记录');
assert.ok(html.includes('不是人民币票面复制图'),'货币商店缺少抽象练习币说明');
assert.ok(paradise.includes('href="money-shop.html"'),'游戏乐园缺少货币商店入口');
assert.ok(paradise.includes('30 个游戏'),'游戏数量没有更新为30');
assert.ok(daily.includes("'money-shop'"),'每日训练营没有接入货币商店');
assert.ok(progress.includes("'money-shop':{name:'货币商店'"),'成长记录没有登记货币商店');
assert.ok(parent.includes("'money-shop':'calculation'"),'家长周报没有登记货币商店能力');
assert.ok(fraction.includes('分数初步认识'),'去重核对没有识别已有分数页面');
assert.ok(roadmap.includes('“分数披萨”因与现有三套分数页面重复而不再开发'),'路线图没有记录分数游戏去重结论');
assert.ok(sources.includes('`hpx-money-shop.js` / `money-shop.html` 货币商店'),'内容来源没有登记货币商店');
console.log(`货币商店检查通过：${generated}组付款、总价与找零随机题有效，30游戏联动和分数功能去重完整。`);
