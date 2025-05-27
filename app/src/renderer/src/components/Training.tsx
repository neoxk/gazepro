import { useRef, useState } from "react";

import handballMan from "@renderer/assets/images/handball-man.svg";

export const Training = () => {
  const [seriesCount, setSeriesCount] = useState(3);
  const [clipsPerSeries, setClipsPerSeries] = useState(5);
  const [speed, setSpeed] = useState(1);
  const [pauseBetweenClips, setPauseBetweenClips] = useState(2);
  const [pauseBetweenSeries, setPauseBetweenSeries] = useState(5);
  const [started, setStarted] = useState(false);

  const [allCategories] = useState(["Reflex", "Positioning", "Focus"]);
  const [seriesCategories, setSeriesCategories] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleCategoryChange = (index: number, category: string) => {
    const updated = [...seriesCategories];
    updated[index] = category;
    setSeriesCategories(updated);
  };

  const handleStart = () => {
    setStarted(true);
    setTimeout(() => {
      if (videoRef.current && videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen().catch(() => {});
      }
    }, 100); // slight delay to ensure rendering
  };

  const handleRestart = () => {
    setStarted(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const renderSeriesCategoryPickers = () =>
    [...Array(seriesCount)].map((_, idx) => (
      <div key={idx} className="col-md-4">
        <label className="form-label">Series {idx + 1} Category</label>
        <select
          className="form-select"
          value={seriesCategories[idx] || ""}
          onChange={(e) => handleCategoryChange(idx, e.target.value)}
        >
          <option value="">Select category</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
    ));

  return (
    <div className="container mt-5 text-dark position-relative" style={{ zIndex: 1 }}>
      <img src={handballMan} alt="Handball Background" className="handball-bg" />
      <h2 className="mb-3 text-dark">Training Module</h2>

      <form className="text-dark" onSubmit={(e) => e.preventDefault()}>
        {/* Form controls */}
        <div className="row mb-3 mt-3 g-3">
          <div className="col-md-2">
            <label className="form-label">Number of Series</label>
            <input
              type="number"
              className="form-control"
              value={seriesCount}
              min={1}
              onChange={(e) => setSeriesCount(+e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Clips per Series</label>
            <input
              type="number"
              className="form-control"
              value={clipsPerSeries}
              min={1}
              onChange={(e) => setClipsPerSeries(+e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Speed (0.5–2.0×)</label>
            <input
              type="number"
              className="form-control"
              value={speed}
              min={0.5}
              max={2}
              step={0.1}
              onChange={(e) => setSpeed(+e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Pause Between Series (s)</label>
            <input
              type="number"
              className="form-control"
              value={pauseBetweenSeries}
              min={0}
              onChange={(e) => setPauseBetweenSeries(+e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Pause Between Clips (s)</label>
            <input
              type="number"
              className="form-control"
              value={pauseBetweenClips}
              min={0}
              onChange={(e) => setPauseBetweenClips(+e.target.value)}
            />
          </div>
        </div>

        {/* Category pickers */}
        <div className="row mb-4 g-3">{renderSeriesCategoryPickers()}</div>

        {/* Buttons */}
        <div className="mb-4 row">
          <div className="col-md-6">
            <button type="button" className="btn btn-red-damask w-100" onClick={handleStart}>
              Start Training
            </button>
          </div>
          <div className="col-md-6">
            <button type="button" className="btn btn-outline-secondary w-100" onClick={handleRestart}>
              Restart
            </button>
          </div>
        </div>

        {/* Video area */}
        <div className="text-center mb-4 mt-5">
          {started ? (
            <video
              ref={videoRef}
              controls
              className="w-100 rounded border"
              style={{ maxHeight: "80vh" }}
              src="videos/training-sequence.mp4"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-100 border border-secondary rounded bg-light text-center py-5">
              <p className="text-muted">
                <i className="bi bi-camera-reels"></i>
                <br />
                Click "Start Training" to begin.
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
