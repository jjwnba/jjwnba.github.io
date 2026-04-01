(() => {
  const postBgArr = ['/img/bg.webp', '/img/bg2.jpg']

  const apply = () => {
    const webBg = document.getElementById('web_bg')
    const bodyWrap = document.getElementById('body-wrap')
    if (!bodyWrap) return

    const isPost = bodyWrap.classList.contains('post')

    if (webBg) {
      webBg.classList.toggle('jjw-post-bg--hidden', !isPost)
    }

    if (isPost) {
      const pageHeader = document.getElementById('page-header')
      if (pageHeader) {
        const pick = postBgArr[Math.floor(Math.random() * postBgArr.length)]
        pageHeader.style.setProperty('--jjw-post-header-bg', `url(${pick})`)
      }
    }
  }

  document.addEventListener('DOMContentLoaded', apply)
  document.addEventListener('pjax:complete', apply)
})()

