(() => {
  if (window.jjwSiteFixesInstalled) return;
  window.jjwSiteFixesInstalled = true;
  let observer;
  function enhance() {
    // Refresh after PJAX so translation stays on the article being read.
    document.querySelectorAll('a[href]').forEach(link => {
      const url = new URL(link.href, location.href);
      if (url.hostname === 'translate.google.com' && url.pathname === '/translate') {
        const original = new URL(url.searchParams.get('u'));
        url.searchParams.set('u', original.origin + location.pathname);
        link.href = url.href;
      }
    });
    const toggle = document.getElementById('toggle-menu');
    const menu = document.getElementById('sidebar-menus');
    observer?.disconnect();
    if (!toggle || !menu) return;
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('tabindex', '0');
    toggle.setAttribute('aria-label', '打开导航菜单');
    toggle.setAttribute('aria-controls', menu.id);
    const sync = () => toggle.setAttribute('aria-expanded', String(menu.classList.contains('open')));
    sync();
    observer = new MutationObserver(sync);
    observer.observe(menu, { attributes: true, attributeFilter: ['class'] });
    if (!toggle.dataset.jjwKeyboard) {
      toggle.dataset.jjwKeyboard = 'true';
      toggle.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle.click();
        }
      });
    }
  }
  document.addEventListener('pjax:complete', enhance);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance);
  else enhance();
})();
