import React from 'react'
import man from '../assets/images/handball-man.svg'
import { Video } from '../core/video/VideoController'

interface SidePanelProps {
  videoList: Video[]
  selectedVideo: Video | null
  onVideoSelect: (vid: Video) => void
}

export const SidePanel = ({ videoList, selectedVideo, onVideoSelect }: SidePanelProps) => {
  return (
    <aside className="bg-dark text-white d-flex flex-column p-3 side-panel aside-side-panel">
      <h5 className="mb-4">Videos</h5>
      {/* <button className="btn btn-outline-light w-100 mb-4" onClick={onOpenFolder}>
        <i className="bi bi-folder2-open me-2" />
        Open Folder…
      </button> */}
      <ul className="nav nav-pills flex-column mb-auto">
        {videoList.map((video) => {
          const isSelected = video.id === selectedVideo?.id

          return (
            <li key={video.id} className="nav-item">
              <button
                className={`nav-link text-start px-2 py-2 rounded mb-1 small d-flex align-items-center w-100 ${
                  isSelected ? 'bg-red-damask text-white' : 'bg-dark text-light'
                }`}
                style={{ border: 'none' }}
                onClick={() => onVideoSelect(video)}
                title={video.id + ' - ' + video.name}
              >
                <i className="bi bi-play-circle me-2" />
                <span className="text-truncate d-inline-block" style={{ maxWidth: '180px' }}>
                  {video.name}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="img-cover">
        <img src={man} alt="Handball Man" className="handball-man" />
      </div>
    </aside>
  )
}
