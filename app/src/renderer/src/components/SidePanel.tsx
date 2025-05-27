import { useState } from 'react';

import man from '../assets/images/handball-man.svg';

interface SidePanelProps {
  onVideoSelect: (videoPath: string) => void;
}

export const SidePanel = ({ onVideoSelect }: SidePanelProps) => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const videoList = [
    'warmup_01.mp4',
    'drill2_360.mov',
    'save_high_3.mp4',
    'angle_top_view.mp4',
    'deflection_test_5.mkv',
  ];

  const handleVideoClick = (video: string) => {
    setSelectedVideo(video);
    // to-do: implementation
    onVideoSelect(`videos/${video}`);
  };

  return (
    <aside
      className="bg-dark text-white d-flex flex-column p-3 side-panel aside-side-panel">
      <h5 className="mb-4">Videos</h5>

      <ul className="nav nav-pills flex-column mb-auto">
        {videoList.map((video, i) => (
          <li key={i} className="nav-item">
            <button
              className={`nav-link text-start px-2 py-2 rounded mb-1 small d-flex align-items-center w-100 ${
                selectedVideo === video ? 'bg-red-damask text-white' : 'bg-dark text-light'
              }`}
              style={{ border: 'none' }}
              onClick={() => handleVideoClick(video)}
            >
              <i className="bi bi-play-circle me-2" />
              {video}
            </button>
          </li>
        ))}
      </ul>

      <div className='img-cover'>
        <img src={man} alt="Handball Man" className="handball-man"/>
      </div>

      <div className="mt-auto">
        <button className="btn btn-outline-light w-100 mt-3">
          <i className="bi bi-files"></i> Select Folder
        </button>
      </div>
    </aside>
  );
};
