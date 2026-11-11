'use strict';
(() => {
  const intro = document.querySelector('#award-intro');
  const key = 'interiores-bartz-award-v2';
  let seen = false;
  try { seen = sessionStorage.getItem(key) === 'seen'; } catch { /* Storage may be blocked. */ }
  if (!intro || seen || location.hash) return;
  const skip = intro.querySelector('.award-intro__skip');
  const stage = intro.querySelector('.award-intro__stage');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const previousFocus = document.activeElement;
  const locked = [];
  let closed = false, timer;
  function finish() {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    try { sessionStorage.setItem(key, 'seen'); } catch { /* Still dismiss normally. */ }
    intro.classList.add('is-leaving');
    document.documentElement.classList.remove('award-intro-active');
    locked.forEach(node => { node.inert = false; });
    document.removeEventListener('keydown', onKey);
    if (intro.contains(document.activeElement)) {
      const target = previousFocus?.isConnected && previousFocus !== document.body
        ? previousFocus : document.querySelector('.header .brand');
      target?.focus({ preventScroll: true });
    }
    document.dispatchEvent(new Event('interiores-intro-finished'));
    setTimeout(() => { intro.hidden = true; }, reduced.matches ? 0 : 400);
  }
  function onKey(event) {
    if (event.key === 'Escape') finish();
    if (event.key === 'Tab') {
      event.preventDefault();
      (document.activeElement === skip && !reduced.matches ? stage : skip).focus();
    }
  }
  function restart() {
    if (closed || reduced.matches) return;
    intro.classList.add('is-resetting');
    void stage.offsetWidth;
    intro.classList.remove('is-resetting');
    clearTimeout(timer);
    timer = setTimeout(finish, 5200);
  }
  intro.hidden = false;
  document.documentElement.classList.add('award-intro-active');
  timer = setTimeout(finish, 5200);
  skip.addEventListener('click', finish);
  stage.addEventListener('click', restart);
  stage.addEventListener('pointermove', event => {
    if (closed || reduced.matches || event.pointerType === 'touch') return;
    const box = stage.getBoundingClientRect();
    stage.style.setProperty('--award-x', `${(event.clientX-box.left-box.width/2)*.035}px`);
    stage.style.setProperty('--award-y', `${(event.clientY-box.top-box.height/2)*.035}px`);
  });
  stage.addEventListener('pointerleave', () => {
    stage.style.removeProperty('--award-x');
    stage.style.removeProperty('--award-y');
  });
  function motionPreference() { stage.tabIndex = reduced.matches ? -1 : 0; }
  motionPreference();
  reduced.addEventListener('change', motionPreference);
  document.addEventListener('keydown', onKey);
  document.addEventListener('DOMContentLoaded', () => {
    if (closed) return;
    for (const node of document.body.children) {
      if (node !== intro && !['SCRIPT', 'STYLE'].includes(node.tagName) && !node.inert) {
        node.inert = true;
        locked.push(node);
      }
    }
    skip.focus({ preventScroll: true });
  }, { once: true });
  addEventListener('pagehide', finish, { once: true });
})();
