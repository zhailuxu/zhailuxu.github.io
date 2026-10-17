(function(global){
  'use strict';
  var KEY='hpxGameFavoritesV1',MAX_FAVORITES=30;
  function clean(value){var list=Array.isArray(value)?value:[];return Array.from(new Set(list.filter(function(id){return typeof id==='string'&&/^[a-z0-9-]+$/.test(id)}))).slice(0,MAX_FAVORITES)}
  function load(){try{return clean(JSON.parse(global.localStorage.getItem(KEY)||'[]'))}catch(error){return[]}}
  function save(ids){ids=clean(ids);try{global.localStorage.setItem(KEY,JSON.stringify(ids))}catch(error){}return ids}
  function has(id){return load().indexOf(id)>=0}
  function toggle(id){var ids=load(),index=ids.indexOf(id);if(index>=0)ids.splice(index,1);else ids.push(id);save(ids);return index<0}
  function recent(progress,limit){var games=progress&&progress.games&&typeof progress.games==='object'?Object.values(progress.games):[];return games.filter(function(game){return game&&game.id&&game.lastPlayed}).sort(function(a,b){return Number(b.lastPlayed)-Number(a.lastPlayed)}).slice(0,limit||6).map(function(game){return{gameId:game.id,lastAt:Number(game.lastPlayed),completed:Number(game.completed)||0}})}
  function dayLabel(at,now){if(!at)return'';var a=new Date(at),b=new Date(now||Date.now());a.setHours(0,0,0,0);b.setHours(0,0,0,0);var days=Math.max(0,Math.round((b-a)/86400000));return days===0?'今天':days===1?'昨天':days+'天前'}
  var api={KEY:KEY,clean:clean,load:load,save:save,has:has,toggle:toggle,recent:recent,dayLabel:dayLabel,clear:function(){try{global.localStorage.removeItem(KEY)}catch(error){}}};
  global.HpxGameLibrary=api;
})(typeof window!=='undefined'?window:globalThis);
