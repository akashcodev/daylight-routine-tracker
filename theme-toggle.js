// theme-toggle.js
// Toggles data-theme="dark"/"light" on <html>, remembers the choice in
// localStorage (so it persists across pages and visits), and updates the
// mobile browser chrome color to match. The icon itself is swapped by CSS
// (see the "#themeToggle::before" rules in daily.css) based on data-theme,
// so no icon-swapping logic is needed here.

(function () {
  var root = document.documentElement;
  var toggleButton = document.getElementById('themeToggle');
  var meta = document.querySelector('meta[name="theme-color"]');

  var LIGHT_THEME_COLOR = '#1c6f5b';
  var DARK_THEME_COLOR = '#10160f';

  function applyMetaColor(theme) {
    if (!meta) return;
    meta.setAttribute('content', theme === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
  }

  // The inline script in <head> already set data-theme before first paint;
  // just sync the theme-color meta tag to match on load.
  applyMetaColor(root.getAttribute('data-theme') || 'light');

  if (toggleButton) {
    toggleButton.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('daylight-theme', next);
      applyMetaColor(next);
    });
  }
})();
