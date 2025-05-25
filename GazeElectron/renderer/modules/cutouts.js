const accordionContainer = document.querySelector('#cutouts-accordion');

document.addEventListener('videos-loaded', renderCutoutsAccordion);
document.addEventListener('cutlist-updated', renderCutoutsAccordion);
document.addEventListener('tab-changed', e => {
  if (e.detail === 'cutouts') renderCutoutsAccordion();
});

async function deleteCut(video, cutIndex) {
  video.cuts.splice(cutIndex, 1);
  await window.electronAPI.saveCuts(video.videoPath, video.cuts);
  renderCutoutsAccordion();
  document.dispatchEvent(new CustomEvent('cutlist-updated'));
}

function renderCutoutsAccordion() {
  accordionContainer.innerHTML = '';
  const videos = window.appState.videos || [];

  let cutoutId = 0;
  videos.forEach((v, vi) => {
    v.cuts.forEach((c, ci) => {
      const cutId = `cutout-${cutoutId++}`;
      const accordionItem = document.createElement('div');
      accordionItem.className = 'accordion-item mb-3';
      accordionItem.innerHTML = `
        <h2 class="accordion-header" id="heading-${cutId}">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${cutId}" aria-expanded="false" aria-controls="collapse-${cutId}">
            <i class="bi bi-film me-2"></i>${c.name} (Cut ${ci + 1})
          </button>
        </h2>
        <div id="collapse-${cutId}" class="accordion-collapse collapse" aria-labelledby="heading-${cutId}" data-bs-parent="#cutouts-accordion">
          <div class="accordion-body">
            <ul class="list-group list-group-flush mb-3">
              <li class="list-group-item"><strong>Iz videa:</strong> ${v.name}</li>
              <li class="list-group-item"><strong>Začetek:</strong> ${c.start.toFixed(2)}</li>
              <li class="list-group-item"><strong>Konec:</strong> ${c.end.toFixed(2)}</li>
              <li class="list-group-item"><strong>Kategorija:</strong> ${c.category}</li>
            </ul>
            <div class="row g-5">
              <div class="col-md-6">
                <button class="btn btn-sm btn-outline-primary w-100" data-video-index="${vi}" data-cut-index="${ci}"><i class="bi bi-play"></i> Predvajaj</button>
              </div>
              <div class="col-md-6">
                <button class="btn btn-sm btn-outline-danger btn-delete w-100" data-video-index="${vi}" data-cut-index="${ci}"><i class="bi bi-trash"></i> Izbriši</button>
              </div>
            </div>
          </div>
        </div>
      `;
      accordionContainer.appendChild(accordionItem);
    });
  });

  accordionContainer.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const vi = parseInt(btn.dataset.videoIndex, 10);
      const ci = parseInt(btn.dataset.cutIndex, 10);
      deleteCut(videos[vi], ci);
    });
  });

  // Optional: Play button logic placeholder
  accordionContainer.querySelectorAll('.btn-outline-primary').forEach(btn => {
    btn.addEventListener('click', () => {
      const vi = parseInt(btn.dataset.videoIndex, 10);
      const ci = parseInt(btn.dataset.cutIndex, 10);
      const cut = videos[vi].cuts[ci];
      console.log(`Play cut from ${cut.start} to ${cut.end} in ${videos[vi].name}`);
      // Implement playback logic here
    });
  });
}
