/* Run before styles load. A new workbench always opens in dark mode. */
(function () {
  var theme = 'dark';
  try { if (localStorage.getItem('blackwire-theme') === 'light') theme = 'light'; } catch (_) {}
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a0808' : '#fbfaf8');
})();
