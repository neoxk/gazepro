const videoPlayer = document.getElementById('video-player');
const timeline    = document.getElementById('timeline');
const preInput    = document.getElementById('pre');
const postInput   = document.getElementById('post');
const catSelect   = document.getElementById('category');
const btnAdd      = document.getElementById('btn-add-cut');

document.addEventListener('video-selected', () => {
  const current = window.appState.current;
  videoPlayer.src = current.videoPath;
  videoPlayer.addEventListener('loadedmetadata', drawCuts, { once: true });
});

btnAdd.addEventListener('click', async () => {
  const current = window.appState.current;
  if (!current) return;
  const t     = videoPlayer.currentTime;
  const start = Math.max(0, t - parseFloat(preInput.value));
  const end   = Math.min(videoPlayer.duration, t + parseFloat(postInput.value));
  const cat   = parseInt(catSelect.value, 10);
  current.cuts.push({ start, end, category: cat });
  await window.electronAPI.saveCuts(current.videoPath, current.cuts);
  drawCuts();
  document.dispatchEvent(new CustomEvent('cutlist-updated'));
});


function drawCuts() {
  const current = window.appState.current;
  if (!current) return;
  const D = videoPlayer.duration;
  timeline.innerHTML = '';
  current.cuts.forEach(c => {
    const seg = document.createElement('div');
    seg.className = 'cut-segment';
    seg.style.left  = `${(c.start/D)*100}%`;
    seg.style.width = `${((c.end-c.start)/D)*100}%`;
    timeline.append(seg);
  });
}

document.addEventListener('video-selected', () => {
  drawCuts();
});

