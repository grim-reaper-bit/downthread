/* The whole site's behaviour. No dependencies, no build step.
 * Everything here degrades to a readable page if it never runs. */
(function () {
  'use strict';

  // Mark the document as scripted before anything else. The stylesheet keys every reveal off this,
  // so a page whose script never runs stays fully readable instead of invisible.
  document.documentElement.classList.add('js');

  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- the island nav gets out of the way going down, comes back going up -- */
  var nav = $('.nav');
  if (nav) {
    var last = window.scrollY;
    var tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        // Never hide near the top, and never hide while the mobile sheet is open.
        nav.classList.toggle('up', y > 220 && y > last && !nav.classList.contains('open'));
        last = y;
        tick = false;
      });
    }, { passive: true });
  }

  /* ---- mobile sheet -------------------------------------------------- */
  var burger = $('.burger');
  var sheet = $('.sheet');
  if (burger && sheet) {
    var lastFocus = null;
    var setOpen = function (on) {
      nav.classList.toggle('open', on);
      sheet.classList.toggle('on', on);
      burger.setAttribute('aria-expanded', on ? 'true' : 'false');
      document.body.style.overflow = on ? 'hidden' : '';
      // Belt and braces with the stylesheet: inert removes the whole subtree from the tab order
      // and the accessibility tree where the browser supports it.
      try { sheet.inert = !on; } catch (e) { /* older browsers rely on visibility:hidden */ }
      if (on) {
        lastFocus = document.activeElement;
        var first = sheet.querySelector('a');
        if (first) first.focus();
      } else if (lastFocus && lastFocus.focus) {
        // Send focus back where it came from, rather than to the top of the document.
        lastFocus.focus();
        lastFocus = null;
      }
    };
    setOpen(false);
    burger.addEventListener('click', function () { setOpen(!sheet.classList.contains('on')); });
    $$('a', sheet).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  }

  /* ---- reveal on entry, staggered within a group --------------------- */
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      seen.unobserve(e.target);
      if (e.target.dataset.run) run(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  $$('.rv').forEach(function (el, i) {
    // The stagger is per-parent, so a bento row cascades but the next section starts fresh.
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) {
      return c.classList && c.classList.contains('rv');
    });
    var pos = sibs.indexOf(el);
    el.style.setProperty('--d', Math.min(pos, 5) * 0.07 + 's');
    seen.observe(el);
  });

  /* ---- the panel mock plays itself once, when it is looked at -------- */
  function run(el) {
    if (calm) {
      $$('.mock-log li', el).forEach(function (li) { li.classList.add('on'); });
      var b0 = $('.bar', el); if (b0) b0.classList.add('go');
      $$('[data-to]', el).forEach(function (n) { n.textContent = n.dataset.to; });
      return;
    }
    var bar = $('.bar', el);
    if (bar) setTimeout(function () { bar.classList.add('go'); }, 260);

    $$('[data-to]', el).forEach(function (n) {
      var to = parseInt(n.dataset.to.replace(/[^0-9]/g, ''), 10) || 0;
      var t0 = 0;
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / 2200);
        var eased = 1 - Math.pow(1 - p, 4);
        n.textContent = Math.round(to * eased).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });

    $$('.mock-log li', el).forEach(function (li, i) {
      setTimeout(function () { li.classList.add('on'); }, 500 + i * 420);
    });
  }

  /* ---- CSV / JSON tabs ----------------------------------------------- */
  /* The panes sit beside the ROW that holds the tabs, not beside the tabs themselves — adding a
   * copy button wrapped the tabs in .tabrow and quietly broke this, so selecting JSON changed
   * aria-selected and nothing else (review, Codex). Walk up to the row first. */
  $$('[data-tabs]').forEach(function (group) {
    var btns = $$('button', group);
    var scope = group.closest('.tabrow') || group;
    var panes = $$('.pane', scope.parentNode);
    if (!panes.length) return;
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        btns.forEach(function (x, j) { x.setAttribute('aria-selected', String(i === j)); });
        panes.forEach(function (p, j) { p.classList.toggle('on', i === j); });
      });
    });
  });

  /* ---- copy the column list ------------------------------------------ */
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = document.getElementById(btn.dataset.copy);
      if (!src || !navigator.clipboard) return;
      navigator.clipboard.writeText(src.textContent.trim()).then(function () {
        var was = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = was; }, 1600);
      });
    });
  });
})();
