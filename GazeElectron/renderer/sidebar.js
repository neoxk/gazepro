window.addEventListener('DOMContentLoaded', () => {
  const btnFolder = document.getElementById('btn-select-folder');
  const listEl    = document.getElementById('video-list');

  btnFolder.addEventListener('click', async () => {
    const res = await window.electronAPI.selectFolder();
    if (res.canceled) return;

    window.appState = window.appState || {};
    window.appState.videos = res.videos;
    delete window.appState.current;

    renderVideoList();
    document.dispatchEvent(new CustomEvent('videos-loaded'));
  });

  function renderVideoList() {
    const videos = window.appState.videos || [];
    listEl.innerHTML = '';
    videos.forEach((v, i) => {
      const div = document.createElement('div');
      div.className = 'video-item';
      div.textContent = v.name;
      div.onclick = () => {
        window.appState.current = v;
        console.log('‼️ video-selected:', v.name);
        document.dispatchEvent(new CustomEvent('video-selected'));
      };
      listEl.append(div);
    });
  }
});
