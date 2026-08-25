(function (global) {
  'use strict';

  var synth = global.speechSynthesis;
  var availableVoices = [];

  function loadVoices() {
    if (!synth) return;
    availableVoices = synth.getVoices();
  }

  function selectVoice(lang) {
    var normalized = String(lang || 'zh-CN').replace('_', '-').toLowerCase();
    var language = normalized.split('-')[0];
    return availableVoices.find(function (voice) {
      return String(voice.lang).replace('_', '-').toLowerCase() === normalized;
    }) || availableVoices.find(function (voice) {
      return String(voice.lang).toLowerCase().indexOf(language) === 0;
    }) || null;
  }

  if (synth) {
    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);
  }

  function createSpeech(options) {
    options = options || {};
    var buttonId = options.buttonId || 'speakToggle';
    var enabled = options.enabled !== false;
    var rate = options.rate || 0.9;
    var pitch = options.pitch || 1.1;
    var timeoutMs = options.timeoutMs || 15000;
    var startDelayMs = options.startDelayMs || 0;
    var activeFinish = null;
    var commandId = 0;

    function updateButton() {
      var button = document.getElementById(buttonId);
      if (!button) return;
      button.textContent = enabled ? '🔊 声音解说 开' : '🔇 声音解说 关';
      button.classList.toggle('on', enabled);
      button.setAttribute('aria-pressed', String(enabled));
    }

    function cancelActive() {
      if (activeFinish) activeFinish();
      if (synth) synth.cancel();
    }

    function stop() {
      commandId++;
      cancelActive();
    }

    function speakUtterance(text, overrides) {
      overrides = overrides || {};
      return new Promise(function (resolve) {
        if (!enabled || !synth || typeof global.SpeechSynthesisUtterance === 'undefined') {
          resolve();
          return;
        }

        cancelActive();
        var utterance = new global.SpeechSynthesisUtterance(String(text));
        var lang = overrides.lang || options.lang || 'zh-CN';
        var voice = selectVoice(lang);
        if (voice) utterance.voice = voice;
        utterance.lang = voice ? voice.lang : lang;
        utterance.rate = overrides.rate || rate;
        utterance.pitch = overrides.pitch || pitch;

        var done = false;
        var timer = null;
        var startTimer = null;
        function finish() {
          if (done) return;
          done = true;
          if (startTimer) global.clearTimeout(startTimer);
          if (timer) global.clearTimeout(timer);
          if (activeFinish === finish) activeFinish = null;
          resolve();
        }

        activeFinish = finish;
        utterance.onend = finish;
        utterance.onerror = finish;
        startTimer = global.setTimeout(function () {
          startTimer = null;
          timer = global.setTimeout(finish, overrides.timeoutMs || timeoutMs);
          synth.speak(utterance);
        }, overrides.startDelayMs === undefined ? startDelayMs : overrides.startDelayMs);
      });
    }

    function speak(text, overrides) {
      commandId++;
      return speakUtterance(text, overrides);
    }

    async function sequence(items, overrides) {
      overrides = overrides || {};
      var ownCommand = ++commandId;
      cancelActive();
      for (var i = 0; i < items.length; i++) {
        if (ownCommand !== commandId || !enabled) return false;
        var item = items[i];
        var text = typeof item === 'object' ? item.text : item;
        if (typeof overrides.onItem === 'function') overrides.onItem(item, i);
        var itemOptions = Object.assign({}, overrides, typeof item === 'object' ? item : {});
        delete itemOptions.text;
        delete itemOptions.gapMs;
        delete itemOptions.onItem;
        await speakUtterance(text, itemOptions);
        if (ownCommand !== commandId || !enabled) return false;
        var gap = typeof item === 'object' && item.gapMs !== undefined ? item.gapMs : (overrides.gapMs || 0);
        if (gap) await new Promise(function (resolve) { global.setTimeout(resolve, gap); });
      }
      return true;
    }

    function setEnabled(nextEnabled, announce) {
      enabled = Boolean(nextEnabled);
      updateButton();
      if (!enabled) stop();
      else if (announce !== false) speak(options.enabledMessage || '声音解说已开启。');
      return enabled;
    }

    function toggle() {
      return setEnabled(!enabled, true);
    }

    updateButton();
    return {
      speak: speak,
      sequence: sequence,
      stop: stop,
      toggle: toggle,
      setEnabled: setEnabled,
      isEnabled: function () { return enabled; }
    };
  }

  function installSpeech(options) {
    var controller = createSpeech(options);
    global.speak = controller.speak;
    global.toggleSpeak = controller.toggle;
    return controller;
  }

  function activateTab(name, names, options) {
    options = options || {};
    var panelPrefix = options.panelPrefix || 'tab-';
    var activeClass = options.activeClass || 'on';
    var buttonSelector = options.buttonSelector || '.tabs .tab-btn';
    var hiddenClass = options.hiddenClass;
    var panelActiveClass = options.panelActiveClass;
    var panelId = options.panelId || function (id) { return panelPrefix + id; };

    names.forEach(function (id) {
      var panel = document.getElementById(panelId(id));
      if (!panel) return;
      if (panelActiveClass) panel.classList.toggle(panelActiveClass, id === name);
      else if (hiddenClass) panel.classList.toggle(hiddenClass, id !== name);
      else panel.style.display = id === name ? '' : 'none';
    });
    document.querySelectorAll(buttonSelector).forEach(function (button, index) {
      button.classList.toggle(activeClass, names[index] === name);
      button.setAttribute('aria-selected', String(names[index] === name));
    });
  }

  function randomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function shuffled(items) {
    var result = Array.from(items);
    for (var i = result.length - 1; i > 0; i--) {
      var j = randomInt(0, i);
      var temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  global.Hpx = Object.freeze({
    speech: Object.freeze({ create: createSpeech, install: installSpeech }),
    tabs: Object.freeze({ activate: activateTab }),
    random: Object.freeze({ int: randomInt, shuffled: shuffled })
  });
})(window);
