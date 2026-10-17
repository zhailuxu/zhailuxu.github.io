// Huipeixue daily-math wrong-answer capture. Active only inside the daily plan iframe.
(function (global) {
  'use strict';

  var params;
  try { params = new URLSearchParams(global.location.search); } catch (error) { return; }
  if (params.get('from') !== 'grade2-daily-math' || global.parent === global) return;

  var dateKey = params.get('date') || '';
  var taskIndex = Number(params.get('task'));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !Number.isInteger(taskIndex) || taskIndex < 0 || taskIndex > 3) return;

  var moduleId = String(global.location.pathname || '').split('/').pop().replace(/\.html?$/i, '');
  var lastAnswer = '';
  var pendingNodes = [];
  var timer = null;
  var recentSignatures = Object.create(null);
  var WRONG_CLASS = /(^|\s)(?:wrong|bad|no|fail|error|incorrect|show-fail|q-wrong|wrong-choice)(?:\s|$)/i;
  var WRONG_TEXT = /(?:不对|答错|错误|错了|还不正确|再算|再想|再看看|超时|正确答案|答案是|应该是)/;
  var ACTION_TEXT = /^(?:检查|提交|下一|提示|开始|返回|完成|再来|重做|清空|撤回|继续|确定)/;

  function compact(value, limit) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit || 240);
  }

  function isVisible(node) {
    if (!node || node.nodeType !== 1) return false;
    var style = global.getComputedStyle ? global.getComputedStyle(node) : null;
    return !style || (style.display !== 'none' && style.visibility !== 'hidden');
  }

  function controlAnswer(node) {
    if (!node || node.nodeType !== 1) return '';
    if (/^(?:INPUT|SELECT|TEXTAREA)$/.test(node.tagName)) return compact(node.value, 100);
    var control = node.closest && node.closest('button,[role="button"],label');
    var text = compact(control && control.textContent, 100);
    return text && !ACTION_TEXT.test(text) ? text : '';
  }

  function rememberAnswer(event) {
    var answer = controlAnswer(event.target);
    if (answer) lastAnswer = answer;
  }

  function isWrongNode(node) {
    if (!node || node.nodeType !== 1 || !isVisible(node)) return false;
    var classes = compact(node.className, 180);
    var text = compact(node.textContent, 280);
    if (!WRONG_CLASS.test(classes)) return false;
    return /^(?:INPUT|SELECT|TEXTAREA|BUTTON)$/.test(node.tagName) || WRONG_TEXT.test(text);
  }

  function visibleText(selector, root) {
    var nodes = (root || document).querySelectorAll(selector);
    for (var index = nodes.length - 1; index >= 0; index--) {
      if (!isVisible(nodes[index])) continue;
      var text = compact(nodes[index].textContent || nodes[index].value, 240);
      if (text && !WRONG_TEXT.test(text)) return text;
    }
    return '';
  }

  function questionText(node) {
    var selectors = '#quizQBox,#quizQ,#qQuestion,#qFormula,#question,.quiz-question,.quiz-text,.quiz-big,.question-text,.q-text,.problem-text,.expr,.formula,.target,.mission';
    var container = node.closest && node.closest('.problem-card,.question-card,.q-card,.quiz-card,.problem,.question-item,.maze-row,.calc-item,.seq-item,.clock-item,.money-item,.pic-item,.word-item,.ineq-item,.comp-item,article,.section');
    var text = container && visibleText(selectors, container);
    if (!text) text = visibleText(selectors, document);
    if (!text && container) {
      var clone = container.cloneNode(true);
      clone.querySelectorAll('button,input,select,textarea,.feedback,.result,.message,[role="status"]').forEach(function (item) { item.remove(); });
      text = compact(clone.textContent, 240);
    }
    return text || '当前练习题（页面未提供可识别的题干文字）';
  }

  function feedbackText(node) {
    var text = compact(node.textContent, 240);
    if (text && WRONG_TEXT.test(text)) return text;
    var container = node.closest && node.closest('.problem-card,.question-card,.q-card,.quiz-card,.problem,.question-item,.calc-item,.seq-item,.clock-item,.money-item,.pic-item,.word-item,.ineq-item,.comp-item,article,.section,.card');
    var feedbacks = (container || document).querySelectorAll('.feedback,.q-feedback,.quiz-fb,.q-fb,.result-msg,.result,.message,[role="status"]');
    for (var index = feedbacks.length - 1; index >= 0; index--) {
      var feedback = compact(feedbacks[index].textContent, 240);
      if (isVisible(feedbacks[index]) && feedback && WRONG_TEXT.test(feedback)) return feedback;
    }
    return '页面已判定本次作答不正确。';
  }

  function selectedAnswer(node) {
    var direct = controlAnswer(node);
    if (direct) return direct;
    var container = node.closest && node.closest('.problem-card,.question-card,.q-card,.quiz-card,.problem,.question-item,.maze-row,.calc-item,.seq-item,.clock-item,.money-item,.pic-item,.word-item,.ineq-item,.comp-item,article,.section,.card');
    var selected = container && container.querySelector('input.wrong,select.wrong,textarea.wrong,button.wrong,button.q-wrong,.wrong-choice');
    return controlAnswer(selected) || lastAnswer || '未能识别作答内容';
  }

  function correctAnswer(feedback) {
    var match = String(feedback).match(/(?:正确答案(?:是|为)?|答案是|答案：|应该是)\s*([^。；，\n]+)/);
    return compact(match && match[1], 120);
  }

  function sendCapture(node) {
    var feedback = feedbackText(node);
    var detail = {
      question: questionText(node),
      answer: /超时/.test(feedback) ? '未作答（超时）' : selectedAnswer(node),
      correct: correctAnswer(feedback),
      feedback: feedback,
      at: new Date().toISOString()
    };
    var signature = [detail.question, detail.answer, detail.feedback].join('|');
    var now = Date.now();
    if (recentSignatures[signature] && now - recentSignatures[signature] < 2500) return;
    recentSignatures[signature] = now;
    Object.keys(recentSignatures).forEach(function (key) { if (now - recentSignatures[key] > 5000) delete recentSignatures[key]; });
    var targetOrigin = global.location.origin && global.location.origin !== 'null' ? global.location.origin : '*';
    global.parent.postMessage({type:'hpx:grade2-daily-wrong',version:1,dateKey:dateKey,taskIndex:taskIndex,moduleId:moduleId,detail:detail}, targetOrigin);
  }

  function flush() {
    timer = null;
    var candidates = pendingNodes.filter(isWrongNode);
    pendingNodes = [];
    if (!candidates.length) return;
    var informative = candidates.filter(function (node) { return WRONG_TEXT.test(compact(node.textContent, 280)); });
    var selected = informative.length ? informative : candidates.filter(function (node) { return /^(?:INPUT|SELECT|TEXTAREA|BUTTON)$/.test(node.tagName); });
    (selected.length ? selected : [candidates[candidates.length - 1]]).forEach(sendCapture);
  }

  function queue(node) {
    if (!node || node.nodeType !== 1) return;
    pendingNodes.push(node);
    if (timer) global.clearTimeout(timer);
    timer = global.setTimeout(flush, 100);
  }

  document.addEventListener('input', rememberAnswer, true);
  document.addEventListener('change', rememberAnswer, true);
  document.addEventListener('click', rememberAnswer, true);
  new MutationObserver(function (records) {
    records.forEach(function (record) {
      queue(record.target.nodeType === 1 ? record.target : record.target.parentElement);
      Array.from(record.addedNodes || []).forEach(function (node) { if (node.nodeType === 1) queue(node); });
    });
  }).observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['class']});
})(window);
