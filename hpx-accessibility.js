(function(global){
  'use strict';
  if(typeof document==='undefined'||global.HpxAccessibility)return;
  function ensureStyles(){if(document.getElementById('hpxAccessibilityStyles'))return;var link=document.createElement('link');link.id='hpxAccessibilityStyles';link.rel='stylesheet';link.href='hpx-accessibility.css';document.head.appendChild(link)}
  function mainTarget(){var target=document.querySelector('main')||document.querySelector('.container');if(!target)return null;if(!target.id)target.id='main-content';if(target.tagName!=='MAIN'&&!target.hasAttribute('role'))target.setAttribute('role','main');return target}
  function ensureSkipLink(){if(document.querySelector('.hpx-skip-link'))return;var target=mainTarget();if(!target)return;var link=document.createElement('a');link.className='hpx-skip-link';link.href='#'+target.id;link.textContent='跳到主要内容';document.body.insertBefore(link,document.body.firstChild)}
  function enhanceStatus(root){var selector='.message,.feedback,.result-message,#message,#feedback,[role="status"]';if(root.matches&&root.matches(selector))setStatus(root);if(root.querySelectorAll)root.querySelectorAll(selector).forEach(setStatus)}
  function setStatus(node){if(!node.hasAttribute('role'))node.setAttribute('role','status');if(!node.hasAttribute('aria-live'))node.setAttribute('aria-live','polite');if(!node.hasAttribute('aria-atomic'))node.setAttribute('aria-atomic','true')}
  function enhanceButtons(root){var selector='[role="button"]';if(root.matches&&root.matches(selector))setButton(root);if(root.querySelectorAll)root.querySelectorAll(selector).forEach(setButton)}
  function setButton(node){if(!node.hasAttribute('tabindex'))node.tabIndex=0}
  function enhanceControls(root){var selector='input:not([aria-label]):not([aria-labelledby]),select:not([aria-label]):not([aria-labelledby]),textarea:not([aria-label]):not([aria-labelledby])';if(!root.querySelectorAll)return;root.querySelectorAll(selector).forEach(function(control){if(control.labels&&control.labels.length)return;var label=control.getAttribute('placeholder')||control.getAttribute('title')||control.getAttribute('name');if(label)control.setAttribute('aria-label',label)})}
  function enhance(root){enhanceStatus(root);enhanceButtons(root);enhanceControls(root)}
  function handleKey(event){if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey)return;var node=event.target.closest&&event.target.closest('[role="button"]');if(!node||node.matches('button,a,input,select,textarea')||node.getAttribute('aria-disabled')==='true')return;if(event.key==='Enter'||event.key===' '){event.preventDefault();node.click()}}
  function init(){ensureStyles();ensureSkipLink();enhance(document.body);document.addEventListener('keydown',handleKey);new MutationObserver(function(records){records.forEach(function(record){record.addedNodes.forEach(function(node){if(node.nodeType===1)enhance(node)})})}).observe(document.body,{childList:true,subtree:true})}
  global.HpxAccessibility={init:init,enhance:enhance};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(typeof window!=='undefined'?window:globalThis);
