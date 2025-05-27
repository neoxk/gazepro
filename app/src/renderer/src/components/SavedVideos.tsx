import { JSX, useState } from "react";

import data from '../assets/data';
import handballMan from '@renderer/assets/images/handball-man.svg';
import videoPlaceholder from '@renderer/assets/images/video-placeholder.png';

interface SavedVideo {
  id: string;
  title: string;
  duration: string;
  source: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string;
}

const sampleData: SavedVideo[] = data;

export const SavedVideos = (): JSX.Element => {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [sortOptions, setSortOptions] = useState<{ [key: string]: boolean }>({
    Title: false,
    Duration: false,
    Category: false,
  });

  const grouped = sampleData.reduce((acc, video) => {
    acc[video.category] = acc[video.category] || [];
    acc[video.category].push(video);
    return acc;
  }, {} as Record<string, SavedVideo[]>);

  const handleSortToggle = (option: string) => {
    setSortOptions({ ...sortOptions, [option]: !sortOptions[option] });
  };

  const togglePlay = (videoId: string) => {
    setPlayingVideoId((prev) => (prev === videoId ? null : videoId));
  };

  return (
    <div className="position-relative">
      {/* Background Image */}
      <img
        src={handballMan}
        alt="Handball Background"
        className="handball-bg"
      />

      <div className="container mt-5 text-dark position-relative" style={{ zIndex: 1 }}>
        {/* Header with sort dropdown */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0 text-dark">Saved Videos</h2>
          <div className="dropdown">
            <button
              className="btn btn-outline-secondary dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Sort
            </button>
            <ul className="dropdown-menu dropdown-menu-end px-3 py-2">
              {Object.keys(sortOptions).map((option) => (
                <li key={option} className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`sort-${option}`}
                    checked={sortOptions[option]}
                    onChange={() => handleSortToggle(option)}
                  />
                  <label className="form-check-label ms-2" htmlFor={`sort-${option}`}>
                    {option}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Video categories */}
        {Object.entries(grouped).map(([category, videos]) => (
          <div key={category} className="mb-5">
            <h5 className="mb-3">{category}</h5>
            <div className="d-flex flex-wrap gap-4">
              {videos.map((video) => (
                <div key={video.id} className="card" style={{ width: "18rem" }}>
                  {playingVideoId === video.id ? (
                    <video
                      src={video.videoUrl}
                      className="card-img-top"
                      controls
                      onClick={() => togglePlay(video.id)}
                      style={{ height: "180px", objectFit: "cover" }}
                    />
                  ) : (
                    <img
                      src={video.thumbnailUrl || videoPlaceholder}
                      alt={video.title}
                      className="card-img-top"
                      style={{ height: "180px", objectFit: "cover", cursor: "pointer" }}
                      onClick={() => togglePlay(video.id)}
                    />
                  )}
                  <div className="card-body">
                    <h5 className="card-title">{video.title}</h5>
                    <p className="card-text mb-1">
                      <strong>Duration:</strong> {video.duration}
                    </p>
                    <p className="card-text mb-2">
                      <strong>Source:</strong> {video.source}
                    </p>
                    <div className="text-center mt-4">
                      <button className="btn btn-danger w-50"><i className="bi bi-trash"></i> Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <hr className="mt-5" />
          </div>
        ))}
      </div>
    </div>
  );
};
