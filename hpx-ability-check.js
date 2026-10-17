(function(global){
  'use strict';
  var KEY='hpxAbilityCheckV1';
  var ABILITIES=[
    {id:'calculation',name:'计算与数感',icon:'➕',gameId:'quantity-flash',description:'快速感知数量，建立稳定数感。'},
    {id:'logic',name:'逻辑推理',icon:'💡',gameId:'pattern-sequence',description:'观察变化，找出图案背后的规律。'},
    {id:'focus',name:'专注控制',icon:'🎯',gameId:'schulte-grid',description:'保持注意，按顺序完成视觉搜索。'},
    {id:'memory',name:'工作记忆',icon:'🧠',gameId:'route-memory',description:'记住路线，并按原顺序复现。'},
    {id:'space',name:'空间想象',icon:'🧊',gameId:'block-rotation',description:'在脑海中旋转图形并找到结果。'},
    {id:'observe',name:'观察辨别',icon:'👀',gameId:'pixel-difference',description:'比较细节，找出两幅图的不同。'}
  ];
  function empty(){return{version:1,status:'new',grade:null,level:null,startedAt:null,completedAt:null,items:[],result:null}}
  function clean(state){if(!state||typeof state!=='object')return empty();var base=empty();Object.keys(base).forEach(function(key){if(state[key]!==undefined)base[key]=state[key]});if(!Array.isArray(base.items))base.items=[];return base}
  function load(){try{return clean(JSON.parse(global.localStorage.getItem(KEY)||'null'))}catch(error){return empty()}}
  function save(state){state=clean(state);try{global.localStorage.setItem(KEY,JSON.stringify(state))}catch(error){}return state}
  function stats(progress,id){var game=progress&&progress.games&&progress.games[id]||{};return{completed:Number(game.completed)||0,mistakes:Number(game.mistakes)||0,hints:Number(game.hints)||0,totalMs:Number(game.totalMs)||0}}
  function levelForGrade(grade){grade=String(grade);if(grade==='k'||grade==='1-2')return'easy';if(grade==='3-4')return'medium';return'hard'}
  function start(grade,progress,now){var time=now||Date.now(),state=empty();state.status='in_progress';state.grade=String(grade);state.level=levelForGrade(grade);state.startedAt=time;state.items=ABILITIES.map(function(ability){return{ability:ability.id,gameId:ability.gameId,baseline:stats(progress,ability.gameId),completedAt:null,metrics:null}});return save(state)}
  function score(metrics){return Math.max(35,Math.min(100,100-metrics.mistakes*14-metrics.hints*10))}
  function label(value){return value>=86?'表现突出':value>=66?'稳定发展':'可以加强'}
  function buildResult(state){var abilities={};state.items.forEach(function(item){abilities[item.ability]=score(item.metrics||{mistakes:0,hints:0})});var focus=Object.keys(abilities).sort(function(a,b){return abilities[a]-abilities[b]}).slice(0,2);return{abilities:abilities,focus:focus,createdAt:state.completedAt}}
  function sync(state,progress,now){state=clean(state);if(state.status!=='in_progress')return state;var changed=false,time=now||Date.now();state.items.forEach(function(item){if(item.completedAt)return;var current=stats(progress,item.gameId),base=item.baseline||{};if(current.completed>(Number(base.completed)||0)){item.completedAt=time;item.metrics={mistakes:Math.max(0,current.mistakes-(Number(base.mistakes)||0)),hints:Math.max(0,current.hints-(Number(base.hints)||0)),durationMs:Math.max(0,current.totalMs-(Number(base.totalMs)||0))};changed=true}});if(state.items.length===ABILITIES.length&&state.items.every(function(item){return Boolean(item.completedAt)})){state.status='complete';state.completedAt=time;state.result=buildResult(state);changed=true}if(changed)save(state);return state}
  function skip(now){var state=empty();state.status='skipped';state.completedAt=now||Date.now();return save(state)}
  function ability(id){return ABILITIES.find(function(item){return item.id===id})}
  var api={KEY:KEY,ABILITIES:ABILITIES,empty:empty,clean:clean,load:load,save:save,start:start,sync:sync,skip:skip,score:score,label:label,levelForGrade:levelForGrade,ability:ability,reset:function(){try{global.localStorage.removeItem(KEY)}catch(error){}}};
  global.HpxAbilityCheck=api;
})(typeof window!=='undefined'?window:globalThis);
