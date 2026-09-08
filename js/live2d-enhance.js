(() => {
  const clickLines = ['你这个人，满脑子都只想到自己呢。', '还真是高高在上呢。']
  let hideTimer
  let idleTimer
  const showLine = (text) => {
    const dialog = document.querySelector('#live2d-widget .live2d-widget-dialog')
    if (!dialog) return
    dialog.textContent = text
    dialog.style.opacity = '1'
    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => { dialog.style.opacity = '0' }, 5000)
  }
  const scheduleIdle = () => {
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      if (!document.hidden) showLine('祝你幸福。')
      scheduleIdle()
    }, 15000)
  }
  const boot = () => {
    const widget = document.getElementById('live2d-widget')
    if (!widget) return
    widget.classList.remove('is-dragging')
  }

  document.addEventListener('DOMContentLoaded', boot)
  document.addEventListener('pjax:complete', boot)
  document.addEventListener('click', (event) => {
    if (!event.target.closest('#live2d-widget canvas')) return
    showLine(clickLines[Math.floor(Math.random() * clickLines.length)])
    scheduleIdle()
  })
  scheduleIdle()
})()
