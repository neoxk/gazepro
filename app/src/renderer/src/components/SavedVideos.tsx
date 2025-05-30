import React, { JSX, useEffect, useState } from 'react'
import handballMan from '@renderer/assets/images/handball-man.svg'
import videoPlaceholder from '@renderer/assets/images/video-placeholder.png'

interface SavedVideo {
  id: string
  title: string
  duration: string
  source: string
  category: string
  videoUrl: string
  thumbnailUrl: string
  start: number
  end: number
}

export const SavedVideos = (): JSX.Element => {
  const [cutouts, setCutouts] = useState<SavedVideo[]>([])
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [sortOptions, setSortOptions] = useState<Record<string, boolean>>({
    Title: false,
    Duration: false,
    Category: false,
  })

  useEffect(() => {
    ;(async () => {
      const rows: Array<{
        video_path: string
        start: number
        end: number
        label: string
        zone: number
        categories: string[]
      }> = await (window.api as any).loadAllCutouts()

      const transformed: SavedVideo[] = rows.map((r, idx) => {
        const durSec = r.end - r.start
        const mm = Math.floor(durSec / 60)
          .toString()
          .padStart(2, '0')
        const ss = Math.floor(durSec % 60)
          .toString()
          .padStart(2, '0')
        const filename = r.video_path.split('/').pop() || r.video_path
        const firstCat = r.categories.length ? r.categories[0] : 'Uncategorized'

        return {
          id: idx.toString(),
          title: r.label,
          duration: `${mm}:${ss}`,
          source: filename,
          category: firstCat,
          videoUrl: r.video_path,
          thumbnailUrl: '',
          start: r.start,
          end: r.end,
        }
      })

      setCutouts(transformed)
    })()
  }, [])

  const grouped = cutouts.reduce<Record<string, SavedVideo[]>>((acc, video) => {
    (acc[video.category] ||= []).push(video)
    return acc
  }, {})

  const handleSortToggle = (option: string) =>
    setSortOptions({ ...sortOptions, [option]: !sortOptions[option] })

  const togglePlay = (videoId: string) =>
    setPlayingVideoId((prev) => (prev === videoId ? null : videoId))

  return (
    <div className="position-relative">
      <img src={handballMan} alt="Handball Background" className="handball-bg" />

      <div
        className="container mt-5 text-dark position-relative"
        style={{ zIndex: 1 }}
      >
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
                  <label
                    className="form-check-label ms-2"
                    htmlFor={`sort-${option}`}
                  >
                    {option}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {Object.entries(grouped).map(([category, videos]) => (
          <div key={category} className="mb-5">
            <h5 className="mb-3">{category}</h5>
            <div className="d-flex flex-wrap gap-4">
              {videos.map((video) => (
                <div key={video.id} className="card" style={{ width: '18rem' }}>
                  {playingVideoId === video.id ? (
                    <video
                      src={video.videoUrl}
                      className="card-img-top"
                      controls
                      autoPlay
                      onLoadedMetadata={(e) => {
                        e.currentTarget.currentTime = video.start
                      }}
                      onTimeUpdate={(e) => {
                        if (e.currentTarget.currentTime >= video.end) {
                          e.currentTarget.pause()
                          setPlayingVideoId(null)
                        }
                      }}
                      style={{ height: '180px', objectFit: 'cover' }}
                    />
                  ) : (
                    <img
                      src={video.thumbnailUrl || videoPlaceholder}
                      alt={video.title}
                      className="card-img-top"
                      style={{
                        height: '180px',
                        objectFit: 'cover',
                        cursor: 'pointer',
                      }}
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
                      <button className="btn btn-danger w-50">
                        <i className="bi bi-trash"></i> Delete
                      </button>
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
  )
}
