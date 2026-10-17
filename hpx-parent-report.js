(function(global){
  'use strict';
  var ABILITIES=[
    {id:'calculation',name:'计算与数感',icon:'➕',color:'#b87848'},
    {id:'logic',name:'逻辑推理',icon:'💡',color:'#7069a8'},
    {id:'focus',name:'专注控制',icon:'🎯',color:'#54816a'},
    {id:'memory',name:'工作记忆',icon:'🧠',color:'#7d6797'},
    {id:'space',name:'空间想象',icon:'🧊',color:'#527d9b'},
    {id:'observe',name:'观察辨别',icon:'👀',color:'#9a744e'}
  ];
  var GAME_ABILITY={
    'number-maze':'calculation','arithmetic-blocks':'calculation','money-shop':'calculation','quantity-flash':'calculation','balance-reasoning':'calculation','time-planner':'calculation','probability-lab':'calculation',
    'pattern-sequence':'logic','color-code':'logic','little-programmer':'logic','rule-switch-station':'logic','shape-sudoku':'logic','clue-detective':'logic','story-order':'logic',
    'schulte-grid':'focus','instruction-challenge':'focus','reaction-control':'focus','block-escape':'focus','pinball':'focus',
    'route-memory':'memory','bead-memory':'memory','rhythm-echo':'memory','pinyin-listening':'memory',
    'mirror-puzzle':'space','block-rotation':'space','shape-packing':'space','coordinate-treasure':'space',
    'pixel-difference':'observe','hanzi-components':'observe','beads':'observe'
  };
  function startOfDay(date){var d=new Date(date);d.setHours(0,0,0,0);return d}
  function weekStart(date){var d=startOfDay(date||new Date()),day=d.getDay();d.setDate(d.getDate()-(day===0?6:day-1));return d}
  function addDays(date,days){var d=new Date(date);d.setDate(d.getDate()+days);return d}
  function dateKey(date){var d=new Date(date),month=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return d.getFullYear()+'-'+month+'-'+day}
  function abilityMeta(id){return ABILITIES.find(function(item){return item.id===id})}
  function emptyAbility(){var result={};ABILITIES.forEach(function(item){result[item.id]={id:item.id,completed:0,mistakes:0,hints:0,totalMs:0,stability:null}});return result}
  function aggregate(progress,start){var from=weekStart(start),to=addDays(from,7),events=(progress&&Array.isArray(progress.events)?progress.events:[]).filter(function(event){return Number(event.at)>=from.getTime()&&Number(event.at)<to.getTime()}),abilities=emptyAbility(),days={},games={};events.forEach(function(event){days[dateKey(new Date(event.at))]=true;var id=GAME_ABILITY[event.gameId],row=id&&abilities[id];if(!row)return;if(!games[event.gameId])games[event.gameId]={gameId:event.gameId,completed:0,visits:0,lastAt:0};games[event.gameId].lastAt=Math.max(games[event.gameId].lastAt,Number(event.at)||0);if(event.type==='visit')games[event.gameId].visits++;if(event.type==='complete'){row.completed++;row.totalMs+=Math.max(0,Number(event.durationMs)||0);games[event.gameId].completed++}else if(event.type==='mistake')row.mistakes++;else if(event.type==='hint')row.hints++});var completed=0,mistakes=0,hints=0,totalMs=0;Object.values(abilities).forEach(function(row){var attempts=row.completed+row.mistakes+row.hints*.5;row.stability=attempts?row.completed/attempts:null;completed+=row.completed;mistakes+=row.mistakes;hints+=row.hints;totalMs+=row.totalMs});return{start:from,end:addDays(from,6),events:events,practiceDays:Object.keys(days).length,completed:completed,mistakes:mistakes,hints:hints,totalMs:totalMs,abilities:abilities,games:Object.values(games).sort(function(a,b){return b.completed-a.completed||b.visits-a.visits||b.lastAt-a.lastAt})}}
  function campSummary(camp,start){var from=weekStart(start),dates=[];for(var i=0;i<7;i++)dates.push(dateKey(addDays(from,i)));var completed=dates.filter(function(key){return camp&&camp.plans&&camp.plans[key]&&camp.plans[key].completedAt}).length,maxStreak=0,running=0;dates.forEach(function(key){if(camp&&camp.plans&&camp.plans[key]&&camp.plans[key].completedAt){running++;maxStreak=Math.max(maxStreak,running)}else running=0});return{completedDays:completed,maxStreak:maxStreak}}
  function trend(current,previous){if(current.completed<2)return'数据较少';if(previous.completed<2)return'开始积累';var delta=(current.stability||0)-(previous.stability||0);if(delta>=.12)return'更稳定';if(delta<=-.12)return'建议关注';return'保持稳定'}
  function assessmentScores(assessment){return assessment&&assessment.status==='complete'&&assessment.result&&assessment.result.abilities||null}
  function focusFromAssessment(assessment){var scores=assessmentScores(assessment);return scores?Object.keys(scores).sort(function(a,b){return scores[a]-scores[b]}).slice(0,2):[]}
  function advice(current,assessment){var enough=current.completed>=3&&current.practiceDays>=2,active=Object.values(current.abilities).filter(function(row){return row.completed+row.mistakes+row.hints>0}),focus=[],maintain=null,focusSource='none';if(enough&&active.length){focus=active.slice().sort(function(a,b){var as=a.stability===null?1:a.stability,bs=b.stability===null?1:b.stability;return as-bs||b.mistakes-a.mistakes||a.completed-b.completed}).slice(0,2).map(function(row){return row.id});maintain=active.slice().sort(function(a,b){return b.completed-a.completed||(b.stability||0)-(a.stability||0)})[0].id;focusSource='week'}else{focus=focusFromAssessment(assessment);if(focus.length)focusSource='assessment'}return{enough:enough,focus:focus,maintain:maintain,focusSource:focusSource}}
  function build(progress,camp,assessment,anchor){var current=aggregate(progress,anchor||new Date()),previous=aggregate(progress,addDays(current.start,-7)),checkins=campSummary(camp,current.start),suggestion=advice(current,assessment),rows=ABILITIES.map(function(meta){var row=current.abilities[meta.id],past=previous.abilities[meta.id];return{meta:meta,completed:row.completed,mistakes:row.mistakes,hints:row.hints,totalMs:row.totalMs,stability:row.stability,trend:trend(row,past)}});return{current:current,previous:previous,checkins:checkins,advice:suggestion,rows:rows}}
  var api={ABILITIES:ABILITIES,GAME_ABILITY:GAME_ABILITY,weekStart:weekStart,addDays:addDays,dateKey:dateKey,abilityMeta:abilityMeta,aggregate:aggregate,campSummary:campSummary,trend:trend,advice:advice,build:build};
  global.HpxParentReport=api;
})(typeof window!=='undefined'?window:globalThis);
