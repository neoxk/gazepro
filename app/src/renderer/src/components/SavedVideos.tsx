import React, { JSX, useEffect, useState } from 'react'
import { Modal } from './Modal'
import { useTranslation } from 'react-i18next'

import handballMan from '@renderer/assets/images/handball-man.svg'
import videoPlaceholder from '@renderer/assets/images/video-placeholder.png'

interface SavedVideo {
  id: number
  title: string
  duration: string
  source: string
  zone?: number
  position: string
  hand: string
  defended: string
  videoUrl: string
  thumbnail_path: string
  start: number
  end: number
}

export const SavedVideos = (): JSX.Element => {
  const { t } = useTranslation();
  const [cutouts, setCutouts] = useState<SavedVideo[]>([])
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [sortOptions, setSortOptions] = useState<Record<string, boolean>>({
    title: false,
    duration: false,
    position: false
  })

  const [selectedVideo, setSelectedVideo] = useState<SavedVideo | null>(null)
  const [editedVideo, setEditedVideo] = useState<SavedVideo | null>(null)
  const [showModal, setShowModal] = useState(false)

  const [selectedZones, setSelectedZones] = useState<number[]>([])
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [allPositions] = useState<string[]>([
    'leftWing',
    'rightWing',
    'center',
    'pivot',
    'backLeft',
    'backRight'
  ])

  const normalizePositionKey = (pos: string): string => {
    const validKeys = ['leftWing', 'rightWing', 'center', 'pivot', 'backLeft', 'backRight'];
    return validKeys.includes(pos) ? pos : 'unspecified';
  };


  const [showAreas, setShowAreas] = useState(false)
  const [showPositions, setShowPositions] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    ;(async () => {
      const rows: Array<{
        id?: number
        video_path: string
        start: number
        end: number
        label: string
        zone: number
        position: string
        shotHand: string
        defended: string
        thumbnail_path?: string
      }> = await (window.api as any).loadAllCutouts()

      const transformed: SavedVideo[] = rows.map((r, idx) => {
        const vid = typeof r.id === 'number' ? r.id : idx
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
          position: normalizePositionKey(r.position) || 'unspecified',
          hand: r.shotHand || t('savedVideosComp.unspecified'),
          defended: r.defended || t('savedVideosComp.unspecified'),
          zone: r.zone,
          videoUrl: r.video_path,
          thumbnail_path: thumbUrl,
          start: r.start,
          end: r.end
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
      [option]: !prev[option]
    }))
  }

  const handleDeleteCard = async (id: number) => {
    try {
      await (window.api as any).deleteCutout(id)
    } catch {}
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
    try {
      await (window.api as any).updateCutout(editedVideo.id, {
      video_path: editedVideo.videoUrl,
      start: editedVideo.start,
      end: editedVideo.end,
      label: editedVideo.title,
      zone: editedVideo.zone,
      shotHand: editedVideo.hand,
      defended: editedVideo.defended,
      position: editedVideo.position,
      thumbnail_path: editedVideo.thumbnail_path
    })
    } catch (err) {
      console.error('Failed to save cutout:', err)
      return
    }
    setCutouts((prev) => prev.map((v) => (v.id === editedVideo.id ? editedVideo : v)))
    setShowModal(false)
  }

  const handleDeleteModal = async () => {
    if (!editedVideo) return
    try {
      await (window.api as any).deleteCutout(editedVideo.id)
    } catch {}
    setCutouts((prev) => prev.filter((v) => v.id !== editedVideo.id))
    setShowModal(false)
  }

  const togglePlay = (videoId: string) =>
    setPlayingVideoId((prev) => (prev === videoId ? null : videoId))

  const toggleZone = (zone: number) => {
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    )
  }

  const togglePosition = (pos: string) => {
    setSelectedPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    )
  }

  const filteredCutouts = cutouts
    .filter(
      (v) =>
        v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.source.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(
      (v) => selectedZones.length === 0 || (v.zone !== undefined && selectedZones.includes(v.zone))
    )
    .filter((v) => selectedPositions.length === 0 || selectedPositions.includes(v.position))
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

      if (sortOptions.Position) {
        comparisons.push(a.position.localeCompare(b.position))
      }

      for (const cmp of comparisons) {
        if (cmp !== 0) return cmp
      }
      return 0
    })

  const grouped = filteredCutouts.reduce<Record<string, SavedVideo[]>>((acc, video) => {
    const key = video.position || 'unspecified';
    if (!acc[key]) acc[key] = [];
    acc[key].push(video);
    return acc;
  }, {});


  return (
    <div className="position-relative">
      <img src={handballMan} alt="Handball Background" className="handball-bg" />
      <div className="container mt-5 text-dark position-relative" style={{ zIndex: 1 }}>
        <h2 className="mb-4 text-dark">{t('savedVideosComp.title')}</h2>
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
                placeholder={t('savedVideosComp.searchPlaceholder')}
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
                {t('savedVideosComp.sortFilter')}
              </button>
              <div
                className="dropdown-menu p-3 w-100"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAreas(false)
                  setShowPositions(false)
                }}
              >
                <h6 className="dropdown-header">{t('savedVideosComp.simpleSort')}</h6>
                {Object.entries(sortOptions).map(([key, value]) => (
                  <div key={key} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`sort-${key}`}
                      checked={value}
                      onChange={() => handleSortToggle(key)}
                    />
                    <label className="form-check-label ms-2" htmlFor={`sort-${key}`}>
                      {t(`savedVideosComp.sort.${key}`)}
                    </label>
                  </div>
                ))}


                <hr className="dropdown-divider" />
                <h6 className="dropdown-header">{t('savedVideosComp.advancedFilter')}</h6>

                <div className="dropdown mb-3">
                  <button
                    className="btn btn-sm btn-outline-red-damask w-100"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowAreas(!showAreas)
                      setShowPositions(false)
                    }}
                  >
                    {t('savedVideosComp.selectAreas')}
                  </button>
                  {showAreas && (
                    <ul
                      className="dropdown-menu show p-2 w-100"
                      style={{ display: 'block' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {Array.from({ length: 9 }, (_, i) => (
                        <li key={i + 1} className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`zone-${i + 1}`}
                            checked={selectedZones.includes(i + 1)}
                            onChange={() => toggleZone(i + 1)}
                          />
                          <label className="form-check-label ms-2" htmlFor={`zone-${i + 1}`}>
                             {t('savedVideosComp.area')} {i + 1}
                          </label>
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
                      setShowPositions(!showPositions)
                      setShowAreas(false)
                    }}
                  >
                    {t('savedVideosComp.selectPositions')}
                  </button>
                  {showPositions && (
                    <ul
                      className="dropdown-menu show p-2 w-100"
                      style={{ display: 'block' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {allPositions.map((pos) => (
                        <li key={pos} className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`position-${pos}`}
                            checked={selectedPositions.includes(pos)}
                            onChange={() => togglePosition(pos)}
                          />
                          <label className="form-check-label ms-2" htmlFor={`position-${pos}`}>
                            {t(pos)}
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Render grouped cutouts by position */}
        {Object.entries(grouped).map(([position, videos]) => (
          <div key={position} className="mb-5">
            <h5 className="mb-3">{t(position) || position}</h5>
            <div className="d-flex flex-wrap gap-4">
              {videos.map((video) => (
                <div key={video.id} className="card" style={{ width: '18rem' }}>
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
                        cursor: 'pointer'
                      }}
                      onClick={() => togglePlay(video.id.toString())}
                    />
                  )}
                  <div className="card-body">
                    <h5 className="card-title">{video.title}</h5>
                    <p className="card-text mb-1">
                      <strong>{t('savedVideosComp.duration')}:</strong> {video.duration}
                    </p>
                    <p className="card-text mb-2">
                      <strong>{t('savedVideosComp.source')}:</strong> {video.source}
                    </p>
                    <div className="d-flex align-items-center gap-2 mt-3">
                      <button
                        className="btn btn-light btn-red-damask flex-grow-1"
                        onClick={() => handleCardClick(video)}
                      >
                        {t('savedVideosComp.details')}
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
                <h5 className="mb-3">{t('savedVideosComp.snippetInfo')}</h5>
                <div className="mb-3">
                  <label className="form-label">{t('savedVideosComp.titleLabel')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editedVideo.title}
                    onChange={(e) => handleEditChange('title', e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('savedVideosComp.duration')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editedVideo.duration}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('savedVideosComp.source')}</label>
                  <input type="text" className="form-control" value={editedVideo.source} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('savedVideosComp.area')}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editedVideo.zone ?? ''}
                    onChange={(e) => handleEditChange('zone', e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('hands.shotHand')}</label>
                  <div className="d-flex gap-2">
                    {['left', 'right'].map((hand) => (
                      <div className="w-100" key={hand}>
                        <input
                          type="radio"
                          className="btn-check"
                          name="modal-hand"
                          id={`modal-hand-${hand}`}
                          autoComplete="off"
                          checked={editedVideo.hand === hand}
                          onChange={() => handleEditChange('hand', hand)}
                        />
                        <label
                          className="btn btn-outline-dark w-100"
                          htmlFor={`modal-hand-${hand}`}
                        >
                          {t(`hands.${hand}`)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('defended.wasThereDefence')}</label>
                  <div className="d-flex gap-2">
                    {['yes', 'no'].map((val) => (
                      <div className="w-100" key={val}>
                        <input
                          type="radio"
                          className="btn-check"
                          name="modal-defended"
                          id={`modal-def-${val}`}
                          autoComplete="off"
                          checked={editedVideo.defended === val}
                          onChange={() => handleEditChange('defended', val)}
                        />
                        <label className="btn btn-outline-dark w-100" htmlFor={`modal-def-${val}`}>
                          {t(`defended.${val}`)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('position')}</label>
                  <div className="dropdown w-100">
                    <button
                      className="form-select text-start"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      {editedVideo.position
                        ? t(editedVideo.position)
                        : t('videoEditorComp.selectPosition')}
                    </button>
                    <ul className="dropdown-menu px-3 py-2 w-100" style={{ minWidth: '250px' }}>
                      {allPositions.map((pos) => (
                        <li key={pos} className="mb-2">
                          <input
                            type="radio"
                            className="btn-check"
                            name="modal-position"
                            id={`modal-pos-${pos}`}
                            autoComplete="off"
                            checked={editedVideo.position === pos}
                            onChange={() => handleEditChange('position', pos)}
                          />
                          <label
                            className="btn btn-outline-dark w-100"
                            htmlFor={`modal-pos-${pos}`}
                          >
                            {t(pos)}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="modal-footer d-flex justify-content-end gap-2 mt-5">
                  <button type="button" className="btn btn-light" onClick={handleDeleteModal}>
                    {t('savedVideosComp.delete')}
                  </button>
                  <button type="button" className="btn btn-red-damask" onClick={handleSaveChanges}>
                    {t('savedVideosComp.saveChanges')}
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
