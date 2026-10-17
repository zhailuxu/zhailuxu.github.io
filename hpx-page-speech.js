// Huipeixue speech coverage for legacy learning pages.
// Page-specific narration stays here so older pages can share one tested controller.
(function (global) {
  'use strict';

  var page = (location.pathname.split('/').pop() || 'index.html').split('?')[0];
  var existingSpeechPages = new Set([
    'beads.html','chinese_line.html','chinese_poem.html','clock.html','direction.html',
    'division.html','english.html','hanzi.html','length.html','mixed.html',
    'multiplication.html','numbers.html','placevalue.html','shapes.html','weight.html'
  ]);
  var configs = {
    'index.html': {
      welcome: '欢迎来到慧陪学。这里有课程、练习、学习地图和每日训练营，请选择想学习的内容。',
      focus: '.card'
    },
    'ability-check.html': {
      welcome: '欢迎进行首次能力小测。先选择孩子目前所在年级，再按顺序完成六个小游戏。',
      observe: '#progressText,#focusBox,.task h3,.task p', focus: '.task,.grade'
    },
    'achievements.html': {
      welcome: '这里记录坚持、进步和独立完成获得的徽章，不和其他孩子排名。',
      observe: '#summaryText,#nextText,.badge h2,.badge p', focus: '.badge'
    },
    'bead-memory.html': {
      welcome: '欢迎来到闪记拼豆。先观察彩豆的颜色和位置，图案隐藏后再把它还原出来。',
      observe: '#coverText,#message,#progressText', focus: '.board-panel,#palette button'
    },
    'rhythm-echo.html': {
      welcome: '欢迎来到节奏回声。先播放节奏，听完以后，再按原顺序敲回来。语音讲解和节奏声音可以分别控制。',
      readPage: true
    },
    'daily-camp.html': {
      welcome: '欢迎来到每日训练营。今天有三个短任务，分别训练计算、逻辑和专注。',
      observe: '#progressText,#profileNote,#recapDirection,#recapTomorrow,#recapCheer', focus: '.mission'
    },
    'data-classification.html': {
      welcome: '欢迎来到分类统计小调查。先把卡片放进正确的分类盒，再根据统计表回答问题。',
      observe: '#ruleText,#message,#question', focus: '.item,.bin,.option'
    },
    'game-paradise.html': {
      welcome: '欢迎来到游戏乐园。你可以按能力筛选游戏，也可以继续最近玩过或收藏的游戏。',
      focus: '.game-card,.favorite-card,.recent-card'
    },
    'game-progress.html': {
      welcome: '这里展示保存在当前浏览器中的游戏成长记录，包括完成次数、练习时间和建议加强的方向。',
      observe: '#weakList,#recentList', focus: '.game,.weak,.recent', readPage: true
    },
    'math1.html': {
      welcome: '欢迎来到数学小练习。选择题型、范围和题目数量，再点击出题开始练习。',
      observe: '.correct-answer-hint,#statsTitle', focus: '.problem-card'
    },
    'math_drill.html': {
      welcome: '欢迎来到综合数学练习。选择一个关卡，完成题目后可以查看成绩。',
      observe: '#result-score,#result-msg', focus: '.calc-item,.word-item,.question-item,.q-row,.section-title'
    },
    'olympiad1.html': {
      welcome: '欢迎来到一年级数学思维训练。认真读题，完成后提交试卷查看结果和解析。',
      observe: '.q-result,#scoreRow', focus: '.q-row'
    },
    'olympiad2.html': {
      welcome: '欢迎来到二年级数学思维训练。认真读题，完成后提交试卷查看结果和解析。',
      observe: '.q-result,#scoreRow', focus: '.q-row'
    },
    'olympiad3.html': {
      welcome: '欢迎来到三年级数学思维训练。认真读题，完成后提交试卷查看结果和解析。',
      observe: '.q-result,#scoreRow', focus: '.q-row'
    },
    'homework_check.html': {
      welcome: '这里可以拍照或上传作业图片进行检查。识别结果仅供参考，请家长帮助核对。',
      observe: '#annoHint,.q-text,.q-confirm', focus: '.q-row'
    },
    'homework_checkv2.html': {
      welcome: '这是作业检查实验版。先核对文字识别结果，再让本地模型判断答案。',
      observe: '.ocr-confirm-hint,.q-text,.q-confirm', focus: '.q-row'
    },
    'chinese-study-plan.html': { welcome: '这是六年语文学习地图，可以使用朗读本页依次听各年级重点。', readPage: true },
    'english-study-plan.html': { welcome: '这是六年英语学习地图，可以使用朗读本页依次听各年级重点。', readPage: true },
    'mindset-habits-plan.html': { welcome: '这是学习心态与习惯建议，可以使用朗读本页听完整内容。', readPage: true },
    'overview-review-plan.html': { welcome: '这是三科综合复习地图，可以使用朗读本页依次听复习建议。', readPage: true },
    'study-plan.html': { welcome: '这是六年数学学习地图，可以使用朗读本页依次听各年级重点。', readPage: true },
    'olympiad-roadmap.html': { welcome: '这是数学奥数专项地图。你可以了解不同年级的学习重点、能力和训练方法。', readPage: true },
    'olympiad-special.html': { welcome: '欢迎来到数学思维专项训练营。先选择年级和专项，每个专项都有一组入门练习。', observe: '#guide,#lesson', focus: '.grade-tab,.module,.choice' },
    'olympiad-dashboard.html': { welcome: '这里是数学思维学习总览。你可以查看专项进度、错题数量和本周学习目标。', observe: '#summary,#modules,#week', focus: '.tab,.action,.goal-btn' }
  };

  var config = configs[page];
  var isExisting = existingSpeechPages.has(page);
  if (!config && !isExisting) return;
  if (document.getElementById('speakToggle')) return;

  var style = document.createElement('style');
  style.textContent = '.hpx-page-speech-bar{display:flex;justify-content:center;align-items:center;gap:8px;flex-wrap:wrap;margin:0 auto 14px}'
    + '.hpx-page-speech-button{padding:7px 18px;border:2px solid #9fa8da;border-radius:20px;background:#3f51b5;color:#fff;font-family:inherit;font-size:.9rem;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.08)}'
    + '.hpx-page-speech-button:not(.on){background:#fff;color:#555;border-color:#ccc}'
    + '.hpx-page-read-button{padding:7px 16px;border:2px solid #b39ddb;border-radius:20px;background:#fff;color:#5e35b1;font-family:inherit;font-size:.9rem;font-weight:700;cursor:pointer}'
    + '.hpx-page-speech-button:focus-visible,.hpx-page-read-button:focus-visible{outline:3px solid rgba(63,81,181,.35);outline-offset:2px}';
  document.head.appendChild(style);

  var bar = document.createElement('div');
  bar.className = 'hpx-page-speech-bar';
  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = 'speakToggle';
  toggle.className = 'hpx-page-speech-button on';
  toggle.textContent = '🔊 声音解说 开';
  toggle.setAttribute('aria-pressed','true');
  bar.appendChild(toggle);

  var anchor = document.querySelector('.header,header,.hero');
  if (anchor) anchor.insertAdjacentElement('afterend',bar);
  else {
    var heading = document.querySelector('h1');
    if (heading) heading.insertAdjacentElement('afterend',bar);
    else document.body.insertAdjacentElement('afterbegin',bar);
  }

  function loadCore() {
    if (global.Hpx) return Promise.resolve();
    return new Promise(function (resolve,reject) {
      var found = document.querySelector('script[src="hpx-core.js"]');
      if (found) {
        if (global.Hpx) resolve();
        else { found.addEventListener('load',resolve,{once:true}); found.addEventListener('error',reject,{once:true}); }
        return;
      }
      var script = document.createElement('script');
      script.src = 'hpx-core.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function cleanText(value) {
    return String(value || '').replace(/\s+/g,' ').replace(/🔊 声音解说 (开|关)/g,'').trim();
  }

  function initExisting() {
    toggle.addEventListener('click',function () {
      if (typeof global.toggleSpeak === 'function') global.toggleSpeak();
    });
  }

  function initNew() {
    var controller = global.Hpx.speech.install({rate:0.9,pitch:1.08,timeoutMs:12000});
    var lastText = '';
    var pending = null;
    function narrate(value) {
      var text = cleanText(value).slice(0,320);
      if (!text || text === lastText) return;
      lastText = text;
      global.clearTimeout(pending);
      pending = global.setTimeout(function(){ controller.speak(text); },100);
    }

    toggle.addEventListener('click',function(){ controller.toggle(); });

    if (config.observe) {
      var observer = new MutationObserver(function (mutations) {
        for (var i=mutations.length-1;i>=0;i--) {
          var target = mutations[i].target.nodeType===1 ? mutations[i].target : mutations[i].target.parentElement;
          var matched = target && (target.matches(config.observe) ? target : target.closest(config.observe));
          if (matched && cleanText(matched.textContent)) { narrate(matched.textContent); break; }
        }
      });
      observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    }

    if (config.focus) {
      document.addEventListener('focusin',function(event){
        var item = event.target.closest && event.target.closest(config.focus);
        if (item) narrate(item.textContent);
      });
    }

    if (config.readPage) {
      var readButton = document.createElement('button');
      readButton.type = 'button';
      readButton.className = 'hpx-page-read-button';
      readButton.textContent = '▶ 朗读本页';
      bar.appendChild(readButton);
      var reading = false;
      readButton.addEventListener('click',async function(){
        if (reading) {
          controller.stop(); reading=false; readButton.textContent='▶ 朗读本页'; return;
        }
        var root = document.querySelector('main,.container') || document.body;
        var items = [...root.querySelectorAll('h1,h2,h3,p,li')]
          .filter(function(node){return node.offsetParent!==null && !node.closest('nav,.hpx-page-speech-bar,#fb-mask');})
          .map(function(node){return cleanText(node.textContent);})
          .filter(Boolean)
          .slice(0,120);
        reading=true; readButton.textContent='■ 停止朗读';
        await controller.sequence(items,{gapMs:120});
        reading=false; readButton.textContent='▶ 朗读本页';
      });
    }

    controller.speak(config.welcome);
  }

  if (isExisting && typeof global.toggleSpeak === 'function') initExisting();
  else loadCore().then(function(){
    if (typeof global.toggleSpeak === 'function' && typeof global.speak === 'function' && isExisting) initExisting();
    else initNew();
  }).catch(function(){ toggle.textContent='🔇 不支持语音，请升级浏览器'; toggle.classList.remove('on'); toggle.disabled=true; });
})(window);
