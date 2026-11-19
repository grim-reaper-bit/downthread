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
  /* Open, the menu behaves as a dialog: everything but the nav bar and the menu is inert, and Tab
   * wraps between the two, so focus can never land on a link under the overlay (review, Codex:
   * Tab after the last link reached the page beneath while the menu stayed open). Closed with
   * Escape or the Menu button, focus returns to the Menu button; a menu link closes it and lets the
   * browser move focus to where the link goes. Without the script the button is never shown: the
   * stylesheet shows the ordinary links instead (html:not(.js)). */
  if (burger && sheet && nav) {
    var behind = $$('body > *').filter(function (el) {
      return el !== nav && el !== sheet && el.tagName !== 'SCRIPT';
    });
    var isOpen = function () { return sheet.classList.contains('on'); };
    var stops = function () {
      return $$('a[href], button', nav).concat($$('a[href]', sheet)).filter(function (el) {
        return el.getClientRects().length > 0;
      });
    };
    var setOpen = function (on, restore) {
      nav.classList.toggle('open', on);
      sheet.classList.toggle('on', on);
      burger.setAttribute('aria-expanded', on ? 'true' : 'false');
      burger.setAttribute('aria-label', on ? 'Close menu' : 'Menu');
      document.body.style.overflow = on ? 'hidden' : '';
      // Belt and braces with the stylesheet: inert removes a subtree from the tab order and the
      // accessibility tree where the browser supports it.
      try {
        sheet.inert = !on;
        behind.forEach(function (el) { el.inert = on; });
      } catch (e) { /* older browsers: visibility:hidden and the Tab wrap below */ }
      if (on) {
        var first = sheet.querySelector('a');
        if (first) first.focus();
      } else if (restore) {
        burger.focus();
      }
    };
    setOpen(false, false);
    burger.addEventListener('click', function () { setOpen(!isOpen(), true); });
    // Every link, in the menu or on the bar above it (the logo, to #top), closes the menu: the logo
    // left it open with scrolling locked (review, Codex).
    $$('a', sheet).concat($$('a', nav)).forEach(function (a) {
      a.addEventListener('click', function () { if (isOpen()) setOpen(false, false); });
    });
    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { setOpen(false, true); return; }
      if (e.key !== 'Tab') return;
      var s = stops();
      if (!s.length) return;
      var at = s.indexOf(document.activeElement);
      if (at < 0) { e.preventDefault(); s[0].focus(); }
      else if (e.shiftKey && at === 0) { e.preventDefault(); s[s.length - 1].focus(); }
      else if (!e.shiftKey && at === s.length - 1) { e.preventDefault(); s[0].focus(); }
    });
  }

  /* ---- reveal on entry, staggered within a group --------------------- */
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      seen.unobserve(e.target);
      if (e.target.hasAttribute('data-demo')) countUp(e.target);
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

  /* ---- the hero demo ------------------------------------------------- */
  /* The final number is in the markup, so a blocked script or reduced motion shows 112 and never 0.
   * With motion allowed, it counts up once when the demo is first seen. */
  function countUp(el) {
    if (calm) return;
    $$('[data-count]', el).forEach(function (n) {
      var to = parseInt(n.dataset.count, 10) || 0;
      var t0 = 0;
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / 1600);
        n.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  var demo = $('[data-demo]');
  var stage = demo && $('.stage', demo);
  if (stage) {
    // A small tilt toward the pointer, on desktop with a mouse only. The headline and the install
    // button are outside .stage and never move; phones get the flat stack from the stylesheet.
    var wide = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 761px)');
    var hero = demo.closest('.hero') || demo;
    var nx = 0, ny = 0, frame = 0;
    var paint = function () {
      frame = 0;
      stage.style.setProperty('--tx', nx.toFixed(3));
      stage.style.setProperty('--ty', ny.toFixed(3));
    };
    var clamp = function (v) { return Math.max(-1, Math.min(1, v)); };
    if (!calm) {
      hero.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || !wide.matches) return;
        var r = demo.getBoundingClientRect();
        nx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2));
        ny = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2));
        if (!frame) frame = requestAnimationFrame(paint);
      });
      hero.addEventListener('pointerleave', function () {
        nx = 0; ny = 0;
        if (!frame) frame = requestAnimationFrame(paint);
      });
    }
    // Pointing at either end of the followed reply — in the post or in the file — lights up both.
    $$('[data-follow]', demo).forEach(function (el) {
      el.addEventListener('pointerenter', function () { stage.classList.add('trace'); });
      el.addEventListener('pointerleave', function () { stage.classList.remove('trace'); });
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
