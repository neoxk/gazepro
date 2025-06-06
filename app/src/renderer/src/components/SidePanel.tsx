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
  const selectedName = selectedVideoPath?.split(/[/\\]+/).pop() || null

  return (
    <aside className="bg-dark text-white d-flex flex-column p-3 side-panel aside-side-panel"
      style={{ height: '100vh', overflow: 'hidden' }}
    >
      <h5 className="mb-4">Videos</h5>
      <div className="mx-2">
        <button
          className="btn btn-outline-light w-100 mb-4"
          onClick={onOpenFolder}
        >
          <i className="bi bi-folder2-open me-2" />
          Open Folder…
        </button>
      </div>
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
  <div
    className="app-scroll-bar"
    style={{
      overflowY: 'auto',
      overflowX: 'hidden',
      maxHeight: 'calc(100vh - 250px)', // adjust based on your layout
    }}
  >
    <ul className="nav nav-pills flex-column mb-0">
      {videoList.map((fullPath) => {
        const filename = fullPath.split(/[/\\]+/).pop()!
        const isSelected = filename === selectedName
        return (
          <li key={fullPath} className="nav-item mx-2">
            <button
              className={`nav-link text-start px-2 py-2 rounded mb-1 small d-flex align-items-center w-100 ${
                isSelected ? 'bg-red-damask text-white' : 'bg-dark text-light'
              }`}
              style={{ border: 'none' }}
              onClick={() => onVideoSelect(fullPath)}
              title={filename}
            >
              <i className="bi bi-play-circle me-2" />
              <span
                className="text-truncate d-inline-block"
                style={{ maxWidth: '180px' }}
              >
                {filename}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  </div>
</div>


      <div className="img-cover">
        <img src={man} alt="Handball Man" className="handball-man" />
      </div>
    </aside>
  )
}
