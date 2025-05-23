const tableBody = document.querySelector('#cutout-table tbody');

document.addEventListener('videos-loaded', renderCutoutsTable);
document.addEventListener('cutlist-updated', renderCutoutsTable);
document.addEventListener('tab-changed', e => {
  if (e.detail === 'cutouts') renderCutoutsTable();
});

async function deleteCut(video, cutIndex) {
  video.cuts.splice(cutIndex, 1);
  await window.electronAPI.saveCuts(video.videoPath, video.cuts);
  renderCutoutsTable();
  document.dispatchEvent(new CustomEvent('cutlist-updated'));
}

function renderCutoutsTable() {
  tableBody.innerHTML = '';
  const videos = window.appState.videos || [];
  videos.forEach((v, vi) => {
    v.cuts.forEach((c, ci) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${v.name}</td>
        <td>${c.start.toFixed(2)}</td>
        <td>${c.end.toFixed(2)}</td>
        <td>${c.category}</td>
        <td><button class="btn-delete" data-video-index="${vi}" data-cut-index="${ci}">Izbriši</button></td>
      `;
      tableBody.append(tr);
    });
  });

  tableBody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const vi = parseInt(btn.dataset.videoIndex, 10);
      const ci = parseInt(btn.dataset.cutIndex, 10);
      deleteCut(videos[vi], ci);
    });
  });
}
