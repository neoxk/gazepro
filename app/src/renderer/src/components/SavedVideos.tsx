import React, { JSX, useEffect, useState } from 'react'
import handballMan from '@renderer/assets/images/handball-man.svg'
import videoPlaceholder from '@renderer/assets/images/video-placeholder.png'
import { Modal } from './Modal'

interface SavedVideo {
  id: number
  title: string
  duration: string
  source: string
  category: string
  videoUrl: string
  thumbnail_path: string
  start: number
  end: number
  zone?: number
}

export const SavedVideos = (): JSX.Element => {
  const [cutouts, setCutouts] = useState<SavedVideo[]>([])
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [sortOptions, setSortOptions] = useState<Record<string, boolean>>({
    Title: false,
    Duration: false,
    Category: false,
  })
  
  const [selectedVideo, setSelectedVideo] = useState<SavedVideo | null>(null)
  const [editedVideo, setEditedVideo] = useState<SavedVideo | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  useEffect(() => {
    ;(async () => {
      const rows: Array<{
        id?: number
        video_path: string
        start: number
        end: number
        label: string
        zone: number
        categories: string | string[]
        thumbnail_path?: string
      }> = await (window.api as any).loadAllCutouts()
      
      const transformed: SavedVideo[] = rows.map((r, idx) => {
        const vid = typeof r.id === 'number' ? r.id : idx
        
        let parsedCats: string[] = []
        if (Array.isArray(r.categories)) {
          parsedCats = r.categories
        } else {
          try {
            parsedCats = JSON.parse(r.categories)
          } catch {
            parsedCats = []
          }
        }
        const firstCat = parsedCats.length > 0 ? parsedCats[0] : 'Uncategorized'
        
      const durSec = r.end - r.start
      const mm = Math.floor(durSec / 60)
      .toString()
      .padStart(2, '0')
      const ss = Math.floor(durSec % 60)
      .toString()
      .padStart(2, '0')
      
      const filename = r.video_path.split('/').pop() || r.video_path
      
      const thumbUrl = r.thumbnail_path || ''
      
      return {
        id: vid,
        title: r.label,
        duration: `${mm}:${ss}`,
        source: filename,
        category: firstCat,
        videoUrl: r.video_path,
        thumbnail_path: thumbUrl,
        start: r.start,
        end: r.end,
        zone: r.zone,
      }
      })
      
      setCutouts(transformed)
    })()
  }, [])
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false)
    }
    
    const handleClickOutside = (e: MouseEvent) => {
      const modalContent = document.querySelector('.modal-content')
      if (modalContent && !modalContent.contains(e.target as Node)) {
        setShowModal(false)
      }
    }
    
    if (showModal) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showModal])
  
  const handleSortToggle = (option: string) => {
    setSortOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }))
  }
  
  const handleDeleteCard = async (id: number) => {
    try {
      await (window.api as any).deleteCutout(id)
    } catch {
    }
    setCutouts((prev) => prev.filter((c) => c.id !== id))
    if (selectedVideo && selectedVideo.id === id) {
      setShowModal(false)
    }
  }
  
  const handleCardClick = (video: SavedVideo) => {
    setSelectedVideo(video)
    setEditedVideo({ ...video })
    setShowModal(true)
  }
  
  const handleEditChange = (field: keyof SavedVideo, value: string) => {
    if (!editedVideo) return
      if (field === 'zone') {
        const num = parseInt(value, 10)
        setEditedVideo({ ...editedVideo, zone: isNaN(num) ? undefined : num })
      } else {
        setEditedVideo({ ...editedVideo, [field]: value })
      }
  }
  
  const handleSaveChanges = async () => {
    if (!editedVideo) return
      setCutouts((prev) =>
      prev.map((v) => (v.id === editedVideo.id ? editedVideo : v))
      )
      setShowModal(false)
  }
  
  const handleDeleteModal = async () => {
    if (!editedVideo) return
      try {
        await (window.api as any).deleteCutout(editedVideo.id)
      } catch {
      }
      setCutouts((prev) => prev.filter((v) => v.id !== editedVideo.id))
      setShowModal(false)
  }
  
  const togglePlay = (videoId: string) =>
  setPlayingVideoId((prev) => (prev === videoId ? null : videoId))
  
  const grouped = cutouts.reduce<Record<string, SavedVideo[]>>((acc, video) => {
    if (!acc[video.category]) acc[video.category] = []
      acc[video.category].push(video)
      return acc
  }, {})
  
  return (
    <div className="position-relative">
    <img src={handballMan} alt="Handball Background" className="handball-bg" />
    
    <div
    className="container mt-5 text-dark position-relative"
    style={{ zIndex: 1 }}
    >
    {/* Header + Sort Dropdown */}
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
    
    {/* Render grouped cutouts by category */}
    {Object.entries(grouped).map(([category, videos]) => (
      <div key={category} className="mb-5">
      <h5 className="mb-3">{category}</h5>
      <div className="d-flex flex-wrap gap-4">
      {videos.map((video) => (
        <div
        key={video.id}
        className="card"
        style={{ width: '18rem' }}
        >
        {playingVideoId === video.id.toString() ? (
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
          src={video.thumbnail_path || videoPlaceholder}
          alt={video.title}
          className="card-img-top"
          style={{
            height: '180px',
            objectFit: 'cover',
            cursor: 'pointer',
          }}
          onClick={() =>
            togglePlay(video.id.toString())
          }
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
        <div className="d-flex justify-content-between mt-3">
        <button
        className="btn btn-outline-primary"
        onClick={() => handleCardClick(video)}
        >
        Details
        </button>
        <button
        className="btn btn-danger"
        onClick={() => handleDeleteCard(video.id)}
        >
        <i className="bi bi-trash"></i>
        </button>
        </div>
        </div>
        </div>
      ))}
      </div>
      
      {showModal && editedVideo && (
        <Modal onClose={() => setShowModal(false)}>
        <h5 className="modal-title mb-3">{editedVideo.title}</h5>
        <video
        controls
        className="w-100 mb-3 border rounded"
        src={editedVideo.videoUrl}
        autoPlay
        onLoadedMetadata={(e) => {
          e.currentTarget.currentTime = editedVideo.start
        }}
        onTimeUpdate={(e) => {
          if (e.currentTarget.currentTime >= editedVideo.end) {
            e.currentTarget.pause()
          }
        }}
        />
        <h5 className="mb-3">Snippet Information</h5>
        <div className="mb-3">
        <label className="form-label">Title</label>
        <input
        type="text"
        className="form-control"
        value={editedVideo.title}
        onChange={(e) => handleEditChange('title', e.target.value)}
        />
        </div>
        <div className="mb-3">
        <label className="form-label">Duration</label>
        <input
        type="text"
        className="form-control"
        value={editedVideo.duration}
        disabled
        />
        </div>
        <div className="mb-3">
        <label className="form-label">Source</label>
        <input
        type="text"
        className="form-control"
        value={editedVideo.source}
        disabled
        />
        </div>
        <div className="mb-3">
        <label className="form-label">Area (Zone)</label>
        <input
        type="number"
        className="form-control"
        value={editedVideo.zone ?? ''}
        onChange={(e) => handleEditChange('zone', e.target.value)}
        />
        </div>
        <div className="mb-3">
        <label className="form-label">Category</label>
        <input
        type="text"
        className="form-control"
        value={editedVideo.category}
        onChange={(e) =>
          handleEditChange('category', e.target.value)
        }
        />
        </div>
        <div className="modal-footer d-flex justify-content-between">
        <button
        type="button"
        className="btn btn-primary"
        onClick={handleSaveChanges}
        >
        Save Changes
        </button>
        <button
        type="button"
        className="btn btn-danger"
        onClick={handleDeleteModal}
        >
        Delete
        </button>
        <button
        type="button"
        className="btn btn-light"
        onClick={() => setShowModal(false)}
        >
        Close
        </button>
        </div>
        </Modal>
      )}
      
      <hr className="mt-5" />
      </div>
    ))}
    </div>
    </div>
  )
}
