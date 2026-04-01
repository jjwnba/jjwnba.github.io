(() => {
  const syncPageClass = () => {
    const bodyWrap = document.getElementById('body-wrap')
    const isPost = !!bodyWrap && bodyWrap.classList.contains('post')
    document.body.classList.toggle('jjw-post-page', isPost)
  }

  document.addEventListener('DOMContentLoaded', syncPageClass)
  document.addEventListener('pjax:complete', syncPageClass)
})()
