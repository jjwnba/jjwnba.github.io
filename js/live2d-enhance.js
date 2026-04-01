(() => {
  const boot = () => {
    const widget = document.getElementById('live2d-widget')
    if (!widget) return
    widget.classList.remove('is-dragging')
  }

  document.addEventListener('DOMContentLoaded', boot)
  document.addEventListener('pjax:complete', boot)
})()
