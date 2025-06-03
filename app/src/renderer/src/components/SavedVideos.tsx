import React, { JSX, useEffect, useState } from 'react'
import handballMan from '@renderer/assets/images/handball-man.svg'
import videoPlaceholder from '@renderer/assets/images/video-placeholder.png'
import { Modal } from './Modal'

interface SavedVideo {
  id: number
  title: string
  duration: string
  source: string
  categories: string[]
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

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [modalCategories, setModalCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [allCategories, setAllCategories] = useState<string[]>([])

  const [modalCategoryDropdownOpen, setModalCategoryDropdownOpen] = useState(false);

  const [showAreas, setShowAreas] = useState(false)
  const [showCategories, setShowCategories] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedZones, setSelectedZones] = useState<number[]>([])
  
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
        categories: parsedCats.length > 0 ? parsedCats : ['Uncategorized'],
        videoUrl: r.video_path,
        thumbnail_path: thumbUrl,
        start: r.start,
        end: r.end,
        zone: r.zone,
      }
      })
      
      setCutouts(transformed)

      const allCats = Array.from(
        new Set(transformed.flatMap((v) => v.categories ?? []))
      )

      setAllCategories(allCats)
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
    setModalCategories(video.categories ?? [])
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
    const updated = { ...editedVideo, categories: modalCategories }
    setCutouts((prev) =>
      prev.map((v) => (v.id === updated.id ? updated : v))
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

  const handleCategoryToggle = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    )
  }

  const handleRemoveCategory = (cat: string) => {
    setSelectedCategories((prev) => prev.filter((c) => c !== cat))
  }

  const handleAddCategory = () => {
    const trimmed = newCategory.trim()
    if (!trimmed) return
    if (!allCategories.includes(trimmed)) setAllCategories((prev) => [...prev, trimmed])
    setSelectedCategories((prev) => [...prev, trimmed])
    setNewCategory('')
  }
  
  const togglePlay = (videoId: string) =>
    setPlayingVideoId((prev) => (prev === videoId ? null : videoId))
  
  const toggleZone = (zone: number) => {
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    )
  }

  const filteredCutouts = cutouts
  .filter((v) =>
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.source.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .filter((v) =>
    selectedZones.length === 0 || (v.zone !== undefined && selectedZones.includes(v.zone))
  )
  .filter((v) =>
    selectedCategories.length === 0 ||
    v.categories.some((cat) => selectedCategories.includes(cat))
  )
  .sort((a, b) => {
    const comparisons: number[] = []

    if (sortOptions.Title) {
      comparisons.push(a.title.localeCompare(b.title))
    }

    if (sortOptions.Duration) {
      const durToSec = (dur: string) => {
        const [m, s] = dur.split(':').map(Number)
        return m * 60 + s
      }
      comparisons.push(durToSec(a.duration) - durToSec(b.duration))
    }

    if (sortOptions.Category) {
      const aCat = a.categories?.[0] || ''
      const bCat = b.categories?.[0] || ''
      comparisons.push(aCat.localeCompare(bCat))
    }

    for (const cmp of comparisons) {
      if (cmp !== 0) return cmp
    }
    return 0
  })

  const grouped = filteredCutouts.reduce<Record<string, SavedVideo[]>>((acc, video) => {
    const relevantCats =
      selectedCategories.length > 0
        ? video.categories.filter((cat) => selectedCategories.includes(cat))
        : video.categories

    relevantCats.forEach((cat) => {
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(video)
    })

    return acc
  }, {})


  return (
    <div className="position-relative">
      <img src={handballMan} alt="Handball Background" className="handball-bg" />
      <div
        className="container mt-5 text-dark position-relative"
        style={{ zIndex: 1 }}
      >
      <h2 className="mb-4 text-dark">Saved Videos</h2>
      {/* Header + Sort Dropdown */}
      <div className="row mb-4 g-3 align-items-center">
        <div className="col-md-9">
          <div className="input-group">
            <span className="input-group-text bg-red-damask">
              <i className="bi bi-search text-white"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by title or source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="col-md-3">
          <div className="dropdown">
            <button
              className="btn btn-red-damask dropdown-toggle w-100"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Sort & Filter
            </button>
            <div className="dropdown-menu p-3 w-100"
              onClick={(e) => {
                e.stopPropagation()
                setShowAreas(false)
                setShowCategories(false)
              }}>
              <h6 className="dropdown-header">Simple Sort</h6>
              {Object.keys(sortOptions).map((option) => (
                <div key={option} className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`sort-${option}`}
                    checked={sortOptions[option]}
                    onChange={() => handleSortToggle(option)}
                  />
                  <label className="form-check-label ms-2" htmlFor={`sort-${option}`}>{option}</label>
                </div>
              ))}

              <hr className="dropdown-divider" />
              <h6 className="dropdown-header">Advanced Filter</h6>

              <div className="dropdown mb-3">
                <button
                  className="btn btn-sm btn-outline-red-damask w-100"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowAreas(!showAreas)
                    setShowCategories(false)
                  }}
                >
                  Select Areas
                </button>
                {showAreas && (
                  <ul className="dropdown-menu show p-2 w-100" style={{ display: 'block' }} onClick={(e) => e.stopPropagation()}>
                    {Array.from({ length: 9 }, (_, i) => (
                      <li key={i + 1} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`zone-${i + 1}`}
                          checked={selectedZones.includes(i + 1)}
                          onChange={() => toggleZone(i + 1)}
                        />
                        <label className="form-check-label ms-2" htmlFor={`zone-${i + 1}`}>{i + 1} – Area</label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="dropdown">
                <button
                  className="btn btn-sm btn-outline-red-damask w-100"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowCategories(!showCategories)
                    setShowAreas(false)
                  }}
                >
                  Select Categories
                </button>
                {showCategories && (
                  <ul className="dropdown-menu show p-2 w-100" style={{ display: 'block' }} onClick={(e) => e.stopPropagation()}>
                    {allCategories.map((cat) => (
                      <li key={cat} className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`filter-cat-${cat}`}
                          checked={selectedCategories.includes(cat)}
                          onChange={() => handleCategoryToggle(cat)}
                        />
                        <label className="form-check-label ms-2" htmlFor={`filter-cat-${cat}`}>{cat}</label>
                      </li>
                    ))}
                  </ul> 
                )}
              </div>
            </div>
          </div>
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
                <div className="d-flex align-items-center gap-2 mt-3">
                  <button
                    className="btn btn-light btn-red-damask flex-grow-1"
                    onClick={() => handleCardClick(video)}
                  >
                    Details
                  </button>
                  <button
                    className="btn btn-outline-danger"
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
            <h3 className="modal-title mb-4">{editedVideo.title}</h3>
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
          <label className="form-label">Categories:</label>
          <div className="dropdown w-100">
            <button
              type="button"
              className="form-select text-start"
              onClick={() => setModalCategoryDropdownOpen((prev) => !prev)}
            >
              {modalCategories.length > 0 ? modalCategories.join(', ') : 'Select categories'}
            </button>

            {modalCategoryDropdownOpen && (
              <ul
                className="dropdown-menu show px-3 py-2 w-100"
                style={{ minWidth: '250px', display: 'block' }}
                onClick={(e) => e.stopPropagation()} // Prevent outside click bubbling
              >
                {allCategories.map((cat) => (
                  <li key={cat} className="d-flex align-items-center justify-content-between">
                    <div className="form-check me-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`cat-${cat}`}
                        checked={modalCategories.includes(cat)}
                        onChange={() => {
                          setModalCategories((prev) =>
                            prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                          );
                        }}
                      />
                      <label className="form-check-label ms-2" htmlFor={`cat-${cat}`}>
                        {cat}
                      </label>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm py-0 px-2"
                      title="Remove category"
                      onClick={() => handleRemoveCategory(cat)}
                    >
                      &minus;
                    </button>
                  </li>
                ))}
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <div className="input-group input-group-sm">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="New category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleAddCategory}
                    >
                      +
                    </button>
                  </div>
                </li>
              </ul>
            )}
          </div>
        </div>
              <div className="modal-footer d-flex justify-content-end gap-2 mt-5">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={handleDeleteModal}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="btn btn-red-damask"
                  onClick={handleSaveChanges}
                >
                  Save Changes
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
