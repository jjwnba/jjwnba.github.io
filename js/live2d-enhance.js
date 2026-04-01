(() => {
  const KEY = 'jjw_live2d_pos_v1'

  const clamp = (n, min, max) => Math.min(Math.max(n, min), max)

  const getPoint = (e) => {
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    return { x: e.clientX, y: e.clientY }
  }

  const savePos = (left, top) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ left, top }))
    } catch (_) {}
  }

  const loadPos = () => {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return null
      const data = JSON.parse(raw)
      if (!Number.isFinite(data.left) || !Number.isFinite(data.top)) return null
      return data
    } catch (_) {
      return null
    }
  }

  const placeWidget = (widget, left, top) => {
    const rect = widget.getBoundingClientRect()
    const maxLeft = Math.max(0, window.innerWidth - rect.width)
    const maxTop = Math.max(0, window.innerHeight - rect.height)
    widget.style.left = `${clamp(left, 0, maxLeft)}px`
    widget.style.top = `${clamp(top, 0, maxTop)}px`
    widget.style.right = 'auto'
    widget.style.bottom = 'auto'
  }

  const initDrag = () => {
    const widget = document.getElementById('live2d-widget')
    if (!widget || widget.dataset.dragReady === '1') return false

    const canvas = widget.querySelector('#live2dcanvas') || widget.querySelector('canvas')
    if (!canvas) return false

    widget.dataset.dragReady = '1'

    const saved = loadPos()
    if (saved) {
      placeWidget(widget, saved.left, saved.top)
    }

    let dragging = false
    let startX = 0
    let startY = 0
    let baseLeft = 0
    let baseTop = 0

    const onDown = (e) => {
      if (e.type === 'mousedown' && e.button !== 0) return
      if (e.target.closest('.waifu-tool')) return

      const rect = widget.getBoundingClientRect()
      placeWidget(widget, rect.left, rect.top)

      const p = getPoint(e)
      startX = p.x
      startY = p.y
      baseLeft = rect.left
      baseTop = rect.top
      dragging = true
      widget.classList.add('is-dragging')
      e.preventDefault()
    }

    const onMove = (e) => {
      if (!dragging) return
      const p = getPoint(e)
      const nextLeft = baseLeft + (p.x - startX)
      const nextTop = baseTop + (p.y - startY)
      placeWidget(widget, nextLeft, nextTop)
      e.preventDefault()
    }

    const onUp = () => {
      if (!dragging) return
      dragging = false
      widget.classList.remove('is-dragging')
      const rect = widget.getBoundingClientRect()
      savePos(rect.left, rect.top)
    }

    canvas.addEventListener('mousedown', onDown, { passive: false })
    canvas.addEventListener('touchstart', onDown, { passive: false })
    window.addEventListener('mousemove', onMove, { passive: false })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)

    window.addEventListener('resize', () => {
      const rect = widget.getBoundingClientRect()
      placeWidget(widget, rect.left, rect.top)
      savePos(widget.getBoundingClientRect().left, widget.getBoundingClientRect().top)
    })

    return true
  }

  const boot = () => {
    let tries = 0
    const timer = window.setInterval(() => {
      tries += 1
      if (initDrag() || tries > 40) {
        window.clearInterval(timer)
      }
    }, 250)
  }

  document.addEventListener('DOMContentLoaded', boot)
  document.addEventListener('pjax:complete', boot)
})()
