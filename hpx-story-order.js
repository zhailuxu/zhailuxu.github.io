(function(global){
  'use strict';
  var SCENARIOS=[
    {id:'bean',title:'窗边的小豆苗',steps:['把空花盆放到窗边。','在花盆里装入松软的土。','把豆子轻轻按进土里。','给土壤浇少量清水。','几天后，土面冒出绿色小芽。'],distractor:'把一块橡皮放进文具盒。',reason:'豆子先进入湿润的土壤，之后才可能发芽。'},
    {id:'bag',title:'睡前整理书包',steps:['先查看第二天的课程安排。','把需要的课本放到桌面。','按使用顺序把课本装进书包。','检查铅笔盒里的文具。','拉好书包拉链并放到门边。'],distractor:'把洗好的水杯放在沥水架上。',reason:'先知道第二天需要什么，才能准备正确的课本和文具。'},
    {id:'bridge',title:'纸桥承重实验',steps:['准备两本同样高的书和一张纸。','把两本书隔开一小段距离。','将纸平放在两本书之间。','逐个把小积木放到纸桥中央。','记录纸桥弯下前承受的积木数量。'],distractor:'给窗台上的叶子擦去灰尘。',reason:'纸桥搭好以后才能增加重量，最后才能记录结果。'},
    {id:'umbrella',title:'雨天回家',steps:['出门前看到天空有大片乌云。','把折叠伞放进随身的小包。','放学时发现雨点开始落下。','撑开雨伞走过湿漉漉的小路。','回家后把雨伞打开晾干。'],distractor:'从抽屉里取出一盒彩色粉笔。',reason:'先准备雨伞，降雨时才能使用，使用后再把它晾干。'},
    {id:'ice',title:'观察冰块融化',steps:['从同一个冰格取出两块冰。','把冰块分别放进两个小碗。','将一个碗放在阳光处，另一个放在阴凉处。','每隔一会儿观察两只碗里的变化。','比较并记录哪一块冰先完全融化。'],distractor:'把故事书按书名长短排成一列。',reason:'先设置不同环境并持续观察，最后才能比较融化结果。'},
    {id:'lost',title:'找回借书卡',steps:['准备借书时发现卡片不在口袋里。','回想今天在哪些地方使用过书包。','先检查书桌和书包夹层。','在椅子下面发现掉落的卡片。','把卡片收进带拉链的小袋。'],distractor:'把操场边的落叶扫成一堆。',reason:'发现物品不见后先回想和查找，找到后再妥善收好。'},
    {id:'shelf',title:'整理阅读角',steps:['把阅读角的书全部轻放到桌上。','将破损和完好的书分开放置。','把完好的书按大小分成几组。','依次把各组书摆回书架。','确认书脊朝外并清理桌面。'],distractor:'在花盆旁边摆放一把小喷壶。',reason:'先清空和分类，才能有顺序地摆回并完成检查。'},
    {id:'shadow',title:'记录影子变化',steps:['在晴天早晨选择一根直立的小杆。','用粉笔标出杆子影子的末端。','中午在同一位置再次标记影子。','傍晚再做一次相同的标记。','比较三个标记的方向和距离。'],distractor:'给纸飞机的机翼涂上蓝色圆点。',reason:'在不同时刻完成标记后，才能比较影子的变化。'}
  ];
  function randomInt(min,max,rng){rng=rng||Math.random;return min+Math.floor(rng()*(max-min+1))}
  function shuffled(list,rng){rng=rng||Math.random;var out=list.slice();for(var i=out.length-1;i>0;i--){var j=Math.floor(rng()*(i+1)),tmp=out[i];out[i]=out[j];out[j]=tmp}return out}
  function shuffledDifferent(cards,correct,rng){var result=shuffled(cards,rng),tries=0;while(result.map(function(card){return card.id}).join('|')===correct.join('|')&&tries++<8)result=shuffled(cards,rng);if(result.map(function(card){return card.id}).join('|')===correct.join('|')&&result.length>1){var tmp=result[0];result[0]=result[1];result[1]=tmp}return result}
  function generate(level,rng){rng=rng||Math.random;var scenario=SCENARIOS[randomInt(0,SCENARIOS.length-1,rng)],indexes=level==='easy'?[0,2,4]:[0,1,2,3,4],cards=indexes.map(function(index){return{id:scenario.id+'-'+index,text:scenario.steps[index],distractor:false}}),correct=cards.map(function(card){return card.id}),distractorId=null;if(level==='hard'){distractorId=scenario.id+'-x';cards.push({id:distractorId,text:scenario.distractor,distractor:true})}var initial=shuffledDifferent(cards,correct,rng),active=initial.filter(function(card){return!card.distractor});if(active.map(function(card){return card.id}).join('|')===correct.join('|')){var positions=[];initial.forEach(function(card,index){if(!card.distractor)positions.push(index)});var tmp=initial[positions[0]];initial[positions[0]]=initial[positions[1]];initial[positions[1]]=tmp}var reasons=shuffled([{text:scenario.reason,correct:true},{text:'只要句子长度相近，先后顺序就一定正确。',correct:false},{text:'故事卡可以随意交换，事情的发展不会改变。',correct:false}],rng);return{level:level,title:scenario.title,cards:initial,correctIds:correct,distractorId:distractorId,reasons:reasons}}
  function validate(problem,order,excludedId){var active=order.filter(function(id){return id!==excludedId});return(!problem.distractorId||excludedId===problem.distractorId)&&active.length===problem.correctIds.length&&active.every(function(id,index){return id===problem.correctIds[index]})}
  global.HpxStoryOrder={SCENARIOS:SCENARIOS,generate:generate,validate:validate,shuffled:shuffled,randomInt:randomInt};
})(typeof window!=='undefined'?window:globalThis);
