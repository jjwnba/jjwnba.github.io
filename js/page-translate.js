(() => {
  if (window.jjwPageTranslate) return;
  window.jjwPageTranslate = true;
  const languages = { zh: 'chinese_simplified', en: 'english', ja: 'japanese' };
  let loading;
  let busy = false;
  const prepare = () => {
    document.querySelectorAll('a[href*="#translate-"]').forEach(link => {
      link.classList.add('ignore');
      link.setAttribute('translate', 'no');
      link.removeAttribute('target');
      link.classList.add('no-pjax');
      const group = link.closest('.menus_item, #sidebar-menus .menus_item');
      if (group) group.classList.add('ignore');
    });
    document.querySelectorAll('#menus .menus_item.ignore > .group').forEach(group => {
      group.tabIndex = 0;
      group.setAttribute('role', 'button');
      group.setAttribute('aria-label', 'Translate');
    });
  };
  function notice(text) {
    let box = document.getElementById('translation-status');
    if (!box) {
      box = document.createElement('div');
      box.id = 'translation-status';
      box.className = 'ignore';
      box.setAttribute('role', 'status');
      box.setAttribute('translate', 'no');
      document.body.appendChild(box);
    }
    box.textContent = text;
    box.hidden = !text;
  }
  function load() {
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.staticfile.net/translate.js/3.18.66/translate.js';
      script.async = true;
      const timer = setTimeout(() => { script.remove(); reject(new Error('Translation load timeout')); }, 20000);
      script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error('Translation unavailable')); };
      script.onload = () => {
        clearTimeout(timer);
        try {
          const engine = window.translate;
          engine.selectLanguageTag.show = false;
          engine.language.setLocal('chinese_simplified');
          // Use the library's public translation service.
          engine.ignore.id.push('live2d-widget', 'translation-status');
          engine.ignore.tag.push('pre', 'code', 'textarea', 'input');
          const subtitle = document.getElementById('subtitle');
          if (subtitle) {
            const fixed = subtitle.cloneNode(false);
            fixed.textContent = '乘上与平时相反的列车，为了去看未曾见过的风景';
            subtitle.replaceWith(fixed);
          }
          engine.listener.start();
          resolve(engine);
        } catch (error) { reject(error); }
      };
      document.head.appendChild(script);
    }).catch(error => { loading = null; throw error; });
    return loading;
  }
  document.addEventListener('click', async event => {
    const link = event.target.closest('a[href*="#translate-"]');
    if (!link) return;
    const code = link.hash.replace('#translate-', '');
    if (!languages[code]) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (busy) return;
    if (code === 'zh') {
      sessionStorage.removeItem('jjw-language');
      if (window.translate) window.translate.changeLanguage('chinese_simplified');
      document.documentElement.lang = 'zh-CN';
      notice('');
      return;
    }
    busy = true;
    notice('Loading translation… / 正在加载翻译…');
    try {
      const engine = await load();
      engine.changeLanguage(languages[code]);
      document.documentElement.lang = code;
      sessionStorage.setItem('jjw-language', code);
      notice('Translation requested. If text stays unchanged, check your connection and retry.');
      setTimeout(() => notice(''), 8000);
    } catch (_) {
      notice('Translation unavailable. Please retry. / 翻译服务暂不可用，请重试。');
    } finally { busy = false; }
  }, true);
  document.addEventListener('pjax:complete', () => {
    prepare();
    if (window.translate) window.translate.execute();
  });
  function start() {
    prepare();
    const code = sessionStorage.getItem('jjw-language');
    if (code && languages[code]) load().then(engine => engine.changeLanguage(languages[code])).catch(() => notice('Translation unavailable. Please retry.'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
