/* Keep the welcome screen independent of WebGL. The scene starts only on entry. */
(() => {
  const button = document.querySelector('#enter-button');
  const label = document.querySelector('#enter-label');
  const status = document.querySelector('#load-status');
  const entry = document.querySelector('#entry');
  entry.classList.add('static-preview');
  button.disabled = false;
  label.textContent = '进入我的家';
  status.textContent = '准备好了，进来坐坐';
  document.querySelector('#load-bar').style.width = '0%';

  button.addEventListener('click', () => {
    button.disabled = true;
    label.textContent = '正在点亮这个家';
    status.textContent = '正在布置房间 · 0%';
    let timeout;
    const stop = () => { observer.disconnect(); clearTimeout(timeout); };
    const observer = new MutationObserver(() => {
      if (!document.querySelector('#load-error').hidden) { stop(); return; }
      if (!button.disabled) {
        stop();
        button.click(); // The loaded scene now owns this button's handler.
      }
    });
    observer.observe(button, { attributes: true, attributeFilter: ['disabled'] });
    observer.observe(document.querySelector('#load-error'), { attributes: true, attributeFilter: ['hidden'] });
    function fail() {
      stop();
      entry.hidden = true;
      document.querySelector('#load-error').hidden = false;
      document.querySelector('#error-description').textContent = '房间暂时没有加载出来，可以先看全屋效果。';
      document.querySelector('#retry-load').onclick = () => location.reload();
      document.querySelector('#fallback-open').onclick = () => {
        const dialog = document.querySelector('#info-dialog');
        document.querySelector('#dialog-content').innerHTML = '<h2>我的家</h2><img src="images/home-night.png" alt="全屋夜景">';
        document.querySelector('#dialog-close').onclick = () => dialog.close();
        dialog.showModal();
      };
    }
    timeout = setTimeout(fail, 60000);
    const script = document.createElement('script');
    script.src = 'bundle.19793ffb1086fd2d.js?v=20260908-memory';
    script.onerror = fail;
    document.head.appendChild(script);
  }, { once: true });
})();
