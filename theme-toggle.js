// theme-toggle.js (v2)
// Fresh dark-mode implementation. Uses localStorage key 'dl-theme-v2' and
// clean, minimal runtime to avoid visual cross-fades. Does not reuse old logic.

(function () {
  var KEY = 'dl-theme-v2';
  var root = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  var LIGHT_COLOR = '#1c6f5b';
  var DARK_COLOR = '#0f1412';

  function applyTheme(name) {
    root.setAttribute('data-theme', name);
    if (meta) meta.setAttribute('content', name === 'dark' ? DARK_COLOR : LIGHT_COLOR);
  }

  function toggleTheme() {
    var current = root.getAttribute('data-theme') || 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    // suppress transitions during the flip
    root.classList.add('no-transitions');
    applyTheme(next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
    // allow paints without transitions
    window.setTimeout(function () { root.classList.remove('no-transitions'); }, 60);
  }

  // Initialize toggle button state once DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.classList.toggle('enabled', root.getAttribute('data-theme') === 'dark');
      btn.addEventListener('click', function () {
        toggleTheme();
        btn.classList.toggle('enabled', root.getAttribute('data-theme') === 'dark');
      });
    }
  });
})();
