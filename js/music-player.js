(() => {
  if (document.getElementById('blog-music')) return
  const root = document.createElement('aside')
  root.id = 'blog-music'
  root.className = 'notranslate'
  root.setAttribute('aria-label', '音乐播放器')
  root.innerHTML = `<section id="music-panel" hidden>
    <header><div><small>MY MUSIC · SHUFFLE</small><h3>随身听</h3></div><button class="music-close" aria-label="收起歌单，继续播放">×</button></header>
    <strong class="music-title">随机播放你的收藏</strong><p class="music-artist"></p>
    <div class="music-timeline"><span class="music-time">0:00</span><input class="music-seek" aria-label="播放进度" type="range" min="0" max="100" value="0" step="0.1" disabled><span class="music-duration">0:00</span></div>
    <label class="music-volume">音量 <input aria-label="音量" type="range" min="0" max="1" step="0.05" value="0.6"></label>
    <ol class="music-list"></ol><p class="music-status" role="status" aria-live="polite">正在读取本地歌单…</p>
  </section>
  <div class="music-dock"><button class="music-disc" aria-label="随机播放音乐" title="播放 / 暂停"><span class="music-vinyl" aria-hidden="true"></span><span class="music-symbol" aria-hidden="true">▶</span></button>
    <div class="music-mini"><span class="music-mini-title">随身听</span><span class="music-mini-status">点击唱片，随机播放</span></div>
    <button class="music-next" aria-label="随机下一首" title="下一首" disabled>⏭</button>
    <button class="music-toggle" aria-label="展开歌单" aria-expanded="false" aria-controls="music-panel" title="歌单">☷</button></div>`
  document.body.appendChild(root)
  const find = s => root.querySelector(s)
  const panel = find('#music-panel'), disc = find('.music-disc'), toggle = find('.music-toggle')
  const audio = new Audio()
  audio.preload = 'metadata'
  const volumeKey = 'jjw-music-volume'
  let savedVolume = 0.6
  try {
    const stored = localStorage.getItem(volumeKey)
    const value = stored === null || stored.trim() === '' ? NaN : Number(stored)
    if (Number.isFinite(value) && value >= 0 && value <= 1) savedVolume = value
  } catch { /* Storage may be unavailable; retain the default volume. */ }
  audio.volume = savedVolume
  find('.music-volume input').value = String(savedVolume)
  let tracks = [], current = -1, pending, request = 0
  const failed = new Set()
  const time = n => Number.isFinite(n) ? Math.floor(n / 60) + ':' + String(Math.floor(n % 60)).padStart(2, '0') : '0:00'
  const status = text => { find('.music-status').textContent = text; find('.music-mini-status').textContent = text }
  const state = playing => {
    root.classList.toggle('is-playing', playing)
    find('.music-symbol').textContent = playing ? 'Ⅱ' : '▶'
    disc.setAttribute('aria-label', playing ? '暂停音乐' : '播放音乐')
  }
  async function load() {
    if (tracks.length) return
    if (pending) return pending
    pending = (async () => {
      const response = await fetch('/music/playlist.json', { signal: AbortSignal.timeout(8000) })
      if (!response.ok) throw new Error('歌单加载失败')
      const data = await response.json()
      tracks = data.tracks.filter(t => typeof t.src === 'string' && t.src.startsWith('/music/audio/'))
      if (!tracks.length) throw new Error('歌单中没有音频')
      find('.music-list').replaceChildren(...tracks.map((t, i) => {
        const li = document.createElement('li'), button = document.createElement('button')
        button.textContent = t.title + ' · ' + t.artist
        button.addEventListener('click', () => { failed.delete(i); select(i) })
        li.appendChild(button)
        return li
      }))
      find('.music-next').disabled = tracks.length < 2
      status('点击唱片，随机播放')
    })().finally(() => { pending = null })
    return pending
  }
  async function resume() {
    const id = ++request
    status('正在加载…')
    try { await audio.play() }
    catch (error) {
      if (id !== request || error.name === 'AbortError') return
      state(false)
      status(error.name === 'NotAllowedError' ? '请再次点击唱片允许播放' : '音频无法播放，请切换下一首')
    }
  }
  function select(i) {
    request++
    current = i
    const t = tracks[i]
    audio.src = t.src
    find('.music-title').textContent = t.title
    find('.music-mini-title').textContent = t.title
    find('.music-artist').textContent = t.artist
    find('.music-time').textContent = '0:00'
    find('.music-duration').textContent = time(t.duration)
    find('.music-seek').value = 0
    find('.music-seek').disabled = true
    root.querySelectorAll('.music-list button').forEach((b, j) => b.setAttribute('aria-current', String(i === j)))
    resume()
  }
  async function next() {
    try {
      await load()
      const choices = tracks.map((_, i) => i).filter(i => i !== current && !failed.has(i))
      if (!choices.length) { status('没有其他可用歌曲，请从歌单选择重试'); return }
      select(choices[Math.floor(Math.random() * choices.length)])
    } catch { status('歌单加载失败，点击唱片重试') }
  }
  disc.addEventListener('click', () => {
    if (current < 0) next()
    else if (audio.paused) resume()
    else { request++; audio.pause() }
  })
  find('.music-next').addEventListener('click', next)
  const setPanel = open => {
    panel.hidden = !open
    toggle.setAttribute('aria-expanded', String(open))
    toggle.setAttribute('aria-label', open ? '收起歌单' : '展开歌单')
  }
  toggle.addEventListener('click', () => { setPanel(panel.hidden); load().catch(() => status('歌单加载失败')) })
  find('.music-close').addEventListener('click', () => { setPanel(false); toggle.focus() })
  root.addEventListener('keydown', e => { if (e.key === 'Escape') { setPanel(false); toggle.focus() } })
  find('.music-volume input').addEventListener('input', e => {
    const value = Number(e.target.value)
    if (!Number.isFinite(value) || value < 0 || value > 1) return
    audio.volume = value
    try { localStorage.setItem(volumeKey, String(value)) }
    catch { /* Playback still works when storage is blocked or full. */ }
  })
  find('.music-seek').addEventListener('input', e => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(e.target.value) / 100 * audio.duration })
  audio.addEventListener('playing', () => { state(true); status('正在播放 · 随机模式') })
  audio.addEventListener('pause', () => { state(false); if (!audio.ended) status('已暂停') })
  audio.addEventListener('waiting', () => status('缓冲中…'))
  audio.addEventListener('loadedmetadata', () => {
    find('.music-duration').textContent = time(audio.duration)
    find('.music-seek').disabled = !Number.isFinite(audio.duration)
  })
  audio.addEventListener('timeupdate', () => {
    find('.music-time').textContent = time(audio.currentTime)
    if (audio.duration > 0) find('.music-seek').value = audio.currentTime / audio.duration * 100
  })
  audio.addEventListener('ended', () => { state(false); if (tracks.length === 1) { audio.currentTime = 0; resume() } else next() })
  audio.addEventListener('error', () => { failed.add(current); state(false); status('音频加载失败，请点下一首或从歌单重试') })
  // Deliberately retain audio across panel collapse, tab visibility and Butterfly PJAX navigation.
  load().catch(() => status('歌单加载失败，点击唱片重试'))
})()
