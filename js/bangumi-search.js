(() => {
  function boot() {
    const root = document.querySelector('.bangumi-container');
    if (!root || root.dataset.searchReady) return;
    root.dataset.searchReady = 'true';
    const find = selector => root.querySelector(selector);
    const input = find('#bangumi-search-input');
    const reviewed = find('.jjw-reviewed-only');
    const sort = find('.jjw-search-sort');
    const results = find('.jjw-search-results');
    const list = find('.jjw-search-items');
    const status = find('.jjw-search-status');
    const normalize = text => text.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
    const entries = [...root.querySelectorAll('[data-jjw-original-list] .bangumi-item')].map((node, index) => ({
      node, index, title: normalize(node.querySelector('.bangumi-title').textContent),
      reviewed: node.dataset.jjwReview === 'true', score: Number(node.dataset.jjwScore) || 0
    }));
    let matches = [], page = 0;
    function render() {
      const pages = Math.max(1, Math.ceil(matches.length / 10));
      page = Math.max(0, Math.min(page, pages - 1));
      list.replaceChildren(...matches.slice(page * 10, page * 10 + 10).map(entry => {
        const clone = entry.node.cloneNode(true);
        clone.classList.remove('bangumi-hide');
        clone.querySelectorAll('img[data-bangumi-src]').forEach(img => { img.src = img.dataset.bangumiSrc; });
        return clone;
      }));
      status.textContent = matches.length ? `全部收藏中找到 ${matches.length} 部作品` : '没有找到匹配的作品，请换个番名或取消筛选。';
      find('.jjw-search-page').textContent = `${page + 1} / ${pages}`;
      find('.jjw-search-prev').disabled = page === 0;
      find('.jjw-search-next').disabled = page === pages - 1;
      find('.jjw-search-pages').hidden = matches.length === 0;
    }
    function search() {
      const words = normalize(input.value).split(' ').filter(Boolean);
      const active = words.length > 0 || reviewed.checked || sort.value !== 'original';
      root.classList.toggle('jjw-search-active', active);
      results.hidden = !active;
      if (!active) { list.replaceChildren(); status.textContent = ''; return; }
      matches = entries.filter(entry => words.every(word => entry.title.includes(word)) && (!reviewed.checked || entry.reviewed));
      if (sort.value === 'score') matches.sort((a, b) => b.score - a.score || a.index - b.index);
      page = 0;
      render();
    }
    input.addEventListener('input', event => { if (!event.isComposing) search(); });
    input.addEventListener('compositionend', search);
    reviewed.addEventListener('change', search);
    sort.addEventListener('change', search);
    find('.jjw-search-clear').addEventListener('click', () => { input.value = ''; reviewed.checked = false; sort.value = 'original'; search(); input.focus(); });
    find('.jjw-search-prev').addEventListener('click', () => { page--; render(); });
    find('.jjw-search-next').addEventListener('click', () => { page++; render(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
