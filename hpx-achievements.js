(function(global){
  'use strict';
  var KEY='hpxAchievementsV1';
  var BADGES=[
    {id:'first-finish',icon:'🌱',name:'迈出第一步',category:'开始',description:'第一次完成任意游戏。',test:function(m){return m.completed>=1},progress:function(m){return count(m.completed,1,'次完成')}},
    {id:'three-finishes',icon:'🧩',name:'渐入佳境',category:'坚持',description:'累计完成 3 次游戏。',test:function(m){return m.completed>=3},progress:function(m){return count(m.completed,3,'次完成')}},
    {id:'explore-five',icon:'🧭',name:'好奇探索家',category:'探索',description:'体验 5 个不同游戏。',test:function(m){return m.tracked>=5},progress:function(m){return count(m.tracked,5,'个游戏')}},
    {id:'explore-twelve',icon:'🗺️',name:'乐园漫游者',category:'探索',description:'体验 12 个不同游戏。',test:function(m){return m.tracked>=12},progress:function(m){return count(m.tracked,12,'个游戏')}},
    {id:'steady-three',icon:'🎯',name:'稳稳连胜',category:'进步',description:'在同一个游戏中连续完成 3 次。',test:function(m){return m.bestStreak>=3},progress:function(m){return count(m.bestStreak,3,'次连胜')}},
    {id:'independent-three',icon:'💡',name:'独立思考',category:'独立完成',description:'累计完成 3 次游戏，并且还没有使用过提示。',test:function(m){return m.completed>=3&&m.hints===0},progress:function(m){return m.hints?'使用提示后继续独立尝试':count(m.completed,3,'次无提示完成')}},
    {id:'try-again',icon:'🛠️',name:'再试一次',category:'进步',description:'在一次误选之后，重新尝试并完成同一个游戏。',test:function(m){return m.recovered},progress:function(m){return m.recovered?'已经做到':'出错后再完成 1 次'}},
    {id:'camp-three',icon:'🔥',name:'三日小火苗',category:'坚持',description:'连续完成 3 天每日训练。',test:function(m){return m.dailyStreak>=3},progress:function(m){return count(m.dailyStreak,3,'天连续训练')}},
    {id:'camp-seven',icon:'🌟',name:'一周坚持星',category:'坚持',description:'连续完成 7 天每日训练。',test:function(m){return m.dailyStreak>=7},progress:function(m){return count(m.dailyStreak,7,'天连续训练')}},
    {id:'camp-fourteen',icon:'🏅',name:'十四日成长章',category:'坚持',description:'连续完成 14 天每日训练。',test:function(m){return m.dailyStreak>=14},progress:function(m){return count(m.dailyStreak,14,'天连续训练')}}
  ];
  function count(value,target,label){return Math.min(value,target)+' / '+target+' '+label}
  function empty(){return{version:1,unlocked:{}}}
  function clean(value){var result=empty(),allowed={};BADGES.forEach(function(badge){allowed[badge.id]=true});if(value&&value.unlocked&&typeof value.unlocked==='object')Object.keys(value.unlocked).forEach(function(id){var at=Number(value.unlocked[id]);if(allowed[id]&&at>0)result.unlocked[id]=at});return result}
  function load(){try{return clean(JSON.parse(global.localStorage.getItem(KEY)||'null'))}catch(error){return empty()}}
  function save(value){value=clean(value);try{global.localStorage.setItem(KEY,JSON.stringify(value))}catch(error){}return value}
  function dayBefore(key,days){var date=new Date(key+'T12:00:00');date.setDate(date.getDate()-days);return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')}
  function dateKey(now){var date=new Date(now||Date.now());return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0')}
  function dailyStreak(state,now){var plans=state&&state.plans||{},cursor=dateKey(now),total=0;if(!plans[cursor]||!plans[cursor].completedAt)cursor=dayBefore(cursor,1);while(plans[cursor]&&plans[cursor].completedAt){total++;cursor=dayBefore(cursor,1)}return total}
  function recovered(events){var missed={};return (events||[]).slice().sort(function(a,b){return Number(a.at)-Number(b.at)}).some(function(event){if(event.type==='mistake')missed[event.gameId]=true;return event.type==='complete'&&missed[event.gameId]})}
  function metrics(progress,dailyState,now){progress=progress||{};var games=Object.values(progress.games||{}),events=Array.isArray(progress.events)?progress.events:[];return{completed:games.reduce(function(sum,game){return sum+(Number(game.completed)||0)},0),hints:games.reduce(function(sum,game){return sum+(Number(game.hints)||0)},0),tracked:games.filter(function(game){return Number(game.visits)>0}).length,bestStreak:games.reduce(function(best,game){return Math.max(best,Number(game.bestStreak)||0)},0),recovered:recovered(events),dailyStreak:dailyStreak(dailyState,now)}}
  function evaluate(progress,dailyState,now){now=now||Date.now();var state=load(),m=metrics(progress,dailyState,now),newlyUnlocked=[];BADGES.forEach(function(badge){if(!state.unlocked[badge.id]&&badge.test(m)){state.unlocked[badge.id]=now;newlyUnlocked.push(badge)}});save(state);return{state:state,metrics:m,newlyUnlocked:newlyUnlocked,badges:BADGES.map(function(badge){return Object.assign({},badge,{unlockedAt:state.unlocked[badge.id]||null,progressText:badge.progress(m)})})}}
  function clear(){try{global.localStorage.removeItem(KEY)}catch(error){}}
  global.HpxAchievements={KEY:KEY,BADGES:BADGES,empty:empty,clean:clean,load:load,save:save,metrics:metrics,evaluate:evaluate,dailyStreak:dailyStreak,recovered:recovered,clear:clear};
})(typeof window!=='undefined'?window:globalThis);
