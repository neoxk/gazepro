window.addEventListener('DOMContentLoaded', () => {
  const btnStart    = document.getElementById('btn-start-training');
  const btnRestart  = document.getElementById('btn-restart-training');
  const cfg         = {
    seriesCount: document.getElementById('series-count'),
    clipsPer:    document.getElementById('clips-per-series'),
    speedFactor: document.getElementById('speed-factor'),
    restRep:     document.getElementById('rest-rep'),
    restSeries:  document.getElementById('rest-series'),
  };
  const panelConfig = document.getElementById('training-config');
  const panelTrain  = document.getElementById('training-panel');
  const trainVideo  = document.getElementById('train-video');
  const afterClip   = document.getElementById('after-clip');
  const userInput   = document.getElementById('user-input');
  const btnSubmit   = document.getElementById('btn-submit-input');
  const statsDiv    = document.getElementById('series-stats');
  const statsPanel  = document.getElementById('training-stats');

  let currentVideo     = null;
  let trainingData     = [];
  let curSeries        = 0;
  let curClipIndex     = 0;
  let trainingConfig   = null;

  btnStart.disabled = true;
  document.addEventListener('video-selected', () => {
    currentVideo = window.appState.current;
    btnStart.disabled = !currentVideo;
    if (currentVideo) {
      trainVideo.src = currentVideo.videoPath;
    }
  });

  btnStart.addEventListener('click', () => {
    if (!currentVideo) {
      return alert('Najprej izberite video!');
    }

    trainingConfig = {
      seriesCount: +cfg.seriesCount.value,
      clipsPer:    +cfg.clipsPer.value,
      speed:       +cfg.speedFactor.value,
      restRep:     +cfg.restRep.value * 1000,
      restSeries:  +cfg.restSeries.value * 1000
    };

    const cuts = currentVideo.cuts || [];
    trainingData = [];
    for (let s = 0; s < trainingConfig.seriesCount; s++) {
      trainingData.push(
        shuffle(cuts)
          .slice(0, trainingConfig.clipsPer)
          .map(c => ({ cut: c, response: null, correct: null }))
      );
    }

    panelConfig.classList.add('hidden');
    panelTrain.classList.remove('hidden');
    statsDiv.innerHTML = '';
    statsPanel.classList.add('hidden');

    if (trainVideo.requestFullscreen) {
      trainVideo.requestFullscreen();
    }

    curSeries = 0;
    curClipIndex = 0;
    playNextClip();
  });

  function playNextClip() {
    const cfg = trainingConfig;
    if (curSeries >= trainingData.length) {
      return endTraining();
    }
    const series = trainingData[curSeries];
    if (curClipIndex >= series.length) {
      setTimeout(() => {
        showSeriesStats(curSeries);
        curSeries++;
        curClipIndex = 0;
        setTimeout(playNextClip, 1000);
      }, cfg.restSeries);
      return;
    }

    const entry = trainingData[curSeries][curClipIndex];
    const { start, end, category } = entry.cut;
    trainVideo.playbackRate = cfg.speed;
    trainVideo.currentTime = start;
    trainVideo.play();

    const onTime = () => {
      if (trainVideo.currentTime >= end) {
        trainVideo.pause();
        trainVideo.removeEventListener('timeupdate', onTime);
        afterClip.querySelector('p').textContent =
          `Katero območje (1–7) je vratar branil? (resnično: ${category})`;
        afterClip.classList.remove('hidden');
        userInput.focus();
      }
    };
    trainVideo.addEventListener('timeupdate', onTime);
  }

  btnSubmit.addEventListener('click', () => {
    const val = parseInt(userInput.value, 10);
    if (!(val >= 1 && val <= 6)) {
      alert('Vnesite številko med 1 in 6.');
      return;
    }
    const entry = trainingData[curSeries][curClipIndex];
    entry.response = val;
    entry.correct  = (val === Number(entry.cut.category));

    afterClip.classList.add('hidden');
    userInput.value = '';
    curClipIndex++;

    setTimeout(playNextClip, trainingConfig.restRep);
  });

  function showSeriesStats(idx) {
    const data    = trainingData[idx];
    const correct = data.filter(d => d.correct).length;
    const total   = data.length;
    const pct     = ((correct / total) * 100).toFixed(1);
    statsDiv.innerHTML += `
      <div>
        <h4>Serija ${idx + 1}</h4>
        <p>${correct} od ${total} pravilno (${pct}%)</p>
      </div>`;
  }

  function endTraining() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    let tot = 0, corr = 0;
    trainingData.flat().forEach(e => {
      tot++;
      if (e.correct) corr++;
    });
    const pct = ((corr / tot) * 100).toFixed(1);
    statsDiv.innerHTML += `<hr/><h3>Skupno: ${corr} od ${tot} (${pct}%)</h3>`;
    statsPanel.classList.remove('hidden');
    btnRestart.classList.remove('hidden');
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const btnEnd = document.getElementById('btn-end-training');
  btnEnd.addEventListener('click', () => {
    endTraining();
  });

  btnRestart.addEventListener('click', () => {
    panelConfig.classList.remove('hidden');
    panelTrain.classList.add('hidden');
    statsDiv.innerHTML = '';
    statsPanel.classList.add('hidden');
    afterClip.classList.add('hidden');
    userInput.value = '';
    trainingData = [];
    curSeries    = 0;
    curClipIndex = 0;
    trainingConfig = null;
    document.getElementById('btn-start-training').disabled = false;

    if (window.appState.current) {
      const trainVideo = document.getElementById('train-video');
      trainVideo.src = window.appState.current.videoPath;
      trainVideo.load();
    }
    const trainingTabBtn = document.querySelector('#tabs button[data-tab="training"]');
    if (trainingTabBtn) trainingTabBtn.click();
  });

});
