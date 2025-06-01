import React from 'react'
import man from '../assets/images/handball-man.svg'

interface SidePanelProps {
  videoList: string[]
  selectedVideoPath: string | null
  onVideoSelect: (videoPath: string) => void
  onOpenFolder: () => void
}

export const SidePanel = ({
  videoList,
  selectedVideoPath,
  onVideoSelect,
  onOpenFolder,
}: SidePanelProps) => {
  const selectedName = selectedVideoPath?.split('/').pop() || null

  return (
    <aside className="bg-dark text-white d-flex flex-column p-3 side-panel aside-side-panel">
      <h5 className="mb-4">Videos</h5>

      <ul className="nav nav-pills flex-column mb-auto">
        {videoList.map((fullPath) => {
          const filename = fullPath.split('/').pop()!
          const isSelected = filename === selectedName
          return (
            <li key={fullPath} className="nav-item">
              <button
                className={`nav-link text-start px-2 py-2 rounded mb-1 small d-flex align-items-center w-100 ${
                  isSelected ? 'bg-red-damask text-white' : 'bg-dark text-light'
                }`}
                style={{ border: 'none' }}
                onClick={() => onVideoSelect(fullPath)}
              >
                <i className="bi bi-play-circle me-2" />
                {filename}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="img-cover">
        <img src={man} alt="Handball Man" className="handball-man" />
      </div>

      <button
        className="btn btn-outline-light w-100 mt-3"
        onClick={onOpenFolder}
      >
        <i className="bi bi-folder2-open me-2" />
        Open Folder…
      </button>
    </aside>
  )
}
