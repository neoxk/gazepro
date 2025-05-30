import React from 'react'
import man from '../assets/images/handball-man.svg'

interface SidePanelProps {
  selectedVideoPath: string | null
  onVideoSelect: (videoPath: string) => void
}

export const SidePanel = ({
  selectedVideoPath,
  onVideoSelect,
}: SidePanelProps) => {
  const videoList = [
    'warmup_01.mp4',
    'drill2_360.mov',
    'save_high_3.mp4',
    'angle_top_view.mp4',
    'deflection_test_5.mkv',
  ]

  const selectedName = selectedVideoPath?.split('/').pop() || null

  const api = (window.api as any)

  const handleOpen = async () => {
    const file: string | null = await api.openVideo()
    if (file) {
      onVideoSelect(file)
    }
  }

  return (
    <aside className="bg-dark text-white d-flex flex-column p-3 side-panel aside-side-panel">
      <h5 className="mb-4">Videos</h5>

      <ul className="nav nav-pills flex-column mb-auto">
        {videoList.map((video) => {
          const isSelected = video === selectedName
          return (
            <li key={video} className="nav-item">
              <button
                className={`nav-link text-start px-2 py-2 rounded mb-1 small d-flex align-items-center w-100 ${
                  isSelected ? 'bg-red-damask text-white' : 'bg-dark text-light'
                }`}
                style={{ border: 'none' }}
                onClick={() => onVideoSelect(`videos/${video}`)}
              >
                <i className="bi bi-play-circle me-2" />
                {video}
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
        onClick={handleOpen}
      >
        <i className="bi bi-folder2-open me-2" />
        Open Video…
      </button>
    </aside>
  )
}
