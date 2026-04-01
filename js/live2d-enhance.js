(() => {
  const STORAGE_KEY = 'jjw_live2d_hidden'

  const sayLines = {
    idle: [
      '在看什么呢？',
      '要不要去翻翻归档？',
      '今天也要开开心心。',
      '我在这儿陪你。'
    ],
    hover: [
      '嘿，别戳我啦。',
      '摸摸头也可以。',
      '想听你聊聊。'
    ],
    click: [
      '哎呀！',
      '点到了！',
      '我知道你在！'
    ]
  }

  const pick = arr => arr[Math.floor(Math.random() * arr.length)]

  const ensureShell = () => {
    // The live2d widget mounts elements dynamically; wait for its canvas.
    const canvas = document.getElementById('live2dcanvas') || document.querySelector('canvas#live2dcanvas')
    if (!canvas) return null

    // Find nearest fixed wrapper; fallback to parentNode.
    const widgetRoot =
      canvas.closest('#live2d-widget') ||
      canvas.parentElement

    if (!widgetRoot) return null

    // Avoid double-init
    if (widgetRoot.closest('.jjw-live2d')) return widgetRoot.closest('.jjw-live2d')

    const shell = document.createElement('div')
    shell.className = 'jjw-live2d'

    const bubble = document.createElement('div')
    bubble.className = 'jjw-live2d__bubble'

    const bar = document.createElement('div')
    bar.className = 'jjw-live2d__bar'

    const handle = document.createElement('div')
    handle.className = 'jjw-live2d__handle'
    handle.title = '拖拽移动'

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'jjw-live2d__btn'
    btn.title = '隐藏/显示'
    btn.innerHTML = '<span style="font-weight:700;line-height:1">L2D</span>'

    bar.appendChild(handle)
    bar.appendChild(btn)
    shell.appendChild(bubble)
    shell.appendChild(bar)

    // Insert shell before widget root
    widgetRoot.parentNode.insertBefore(shell, widgetRoot)
    shell.appendChild(widgetRoot)

    return shell
  }

  const initOnce = () => {
    const shell = ensureShell()
    if (!shell) return false

    const bubble = shell.querySelector('.jjw-live2d__bubble')
    const handle = shell.querySelector('.jjw-live2d__handle')
    const btn = shell.querySelector('.jjw-live2d__btn')
    const canvas = shell.querySelector('#live2dcanvas') || shell.querySelector('canvas')

    // restore hidden state
    const hidden = localStorage.getItem(STORAGE_KEY) === '1'
    shell.classList.toggle('is-hidden', hidden)

    let bubbleTimer = null
    const showBubble = (text, ms = 3500) => {
      if (!bubble) return
      bubble.textContent = text
      bubble.classList.add('is-show')
      if (bubbleTimer) window.clearTimeout(bubbleTimer)
      bubbleTimer = window.setTimeout(() => bubble.classList.remove('is-show'), ms)
    }

    // Dialog: hover/click/idle
    shell.addEventListener('mouseenter', () => showBubble(pick(sayLines.hover)))
    if (canvas) canvas.addEventListener('click', () => showBubble(pick(sayLines.click)))

    let idleTick = null
    const startIdle = () => {
      if (idleTick) window.clearInterval(idleTick)
      idleTick = window.setInterval(() => {
        if (!shell.classList.contains('is-hidden')) showBubble(pick(sayLines.idle))
      }, 18000)
    }
    startIdle()

    // Hide / show
    btn?.addEventListener('click', () => {
      const next = !shell.classList.contains('is-hidden')
      shell.classList.toggle('is-hidden', next)
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      if (!next) showBubble('我回来啦。', 2000)
    })

    // Drag via handle (won't interfere with canvas interactions)
    let dragging = false
    let startX = 0
    let startY = 0
    let startRight = 20
    let startBottom = 10

    const parsePx = v => {
      const n = Number.parseFloat(String(v || '0').replace('px', ''))
      return Number.isFinite(n) ? n : 0
    }

    const onDown = e => {
      dragging = true
      const p = e.touches ? e.touches[0] : e
      startX = p.clientX
      startY = p.clientY
      const style = window.getComputedStyle(shell)
      startRight = parsePx(style.right)
      startBottom = parsePx(style.bottom)
      handle.style.cursor = 'grabbing'
      e.preventDefault()
    }

    const onMove = e => {
      if (!dragging) return
      const p = e.touches ? e.touches[0] : e
      const dx = p.clientX - startX
      const dy = p.clientY - startY
      shell.style.right = `${Math.max(0, startRight - dx)}px`
      shell.style.bottom = `${Math.max(0, startBottom - dy)}px`
      e.preventDefault()
    }

    const onUp = () => {
      if (!dragging) return
      dragging = false
      handle.style.cursor = 'grab'
    }

    handle?.addEventListener('mousedown', onDown, { passive: false })
    window.addEventListener('mousemove', onMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    handle?.addEventListener('touchstart', onDown, { passive: false })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)

    return true
  }

  const boot = () => {
    // Try a few times, because widget loads async.
    let tries = 0
    const timer = window.setInterval(() => {
      tries += 1
      const ok = initOnce()
      if (ok || tries > 40) window.clearInterval(timer)
    }, 250)
  }

  document.addEventListener('DOMContentLoaded', boot)
  document.addEventListener('pjax:complete', boot)
})()

