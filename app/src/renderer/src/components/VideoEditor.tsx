import { useRef, useState, useEffect } from 'react'
import { Video } from '../core/video/VideoController'

interface Cutout {
  start: number
  end: number
  label: string
  categories: string[]
}

interface Props {
  selectedVideo: Video | null
}

export const VideoEditor = ({ selectedVideo }: Props) => {
  const [cutouts, setCutouts] = useState<Cutout[]>([])
  const [pre, setPre] = useState(2)
  const [post, setPost] = useState(2)
  const [label, setLabel] = useState('Snippet')
  const [zone, setZone] = useState('1')
  const [allCategories, setAllCategories] = useState<string[]>([
    'Reflex',
    'Positioning',
    'Reactions'
  ])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  const [duration, setDuration] = useState(0)

  const videoName = selectedVideoPath ? selectedVideoPath.split(/[/\\]+/).pop() : null

  useEffect(() => {
    if (!selectedVideoPath) {
      setCutouts([])
      setDuration(0)
      return
    }
    window.api.loadCutouts(selectedVideoPath).then((rows) => setCutouts(rows))
  }, [selectedVideoPath])

  const onLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSaveCutout = async () => {
    if (!videoRef.current || !selectedVideoPath) return

    const current = videoRef.current.currentTime
    const newCutoutFields = {
      video_path: selectedVideoPath,
      start: Math.max(0, current - pre),
      end: current + post,
      label: `${label}`,
      zone: Number(zone),
      categories: selectedCategories
    }

    const snapshotTime = newCutoutFields.start + 0.5
    const dataUrl: string = await new Promise((resolve) => {
      const tempVideo = document.createElement('video')
      tempVideo.src = selectedVideoPath
      tempVideo.crossOrigin = 'anonymous'
      tempVideo.preload = 'metadata'
      tempVideo.muted = true
      tempVideo.playsInline = true

      const onMeta = () => {
        const t = Math.min(snapshotTime, tempVideo.duration - 0.1)
        tempVideo.currentTime = Math.max(0, t)
      }
      const onSeek = () => {
        const intrinsicW = tempVideo.videoWidth
        const intrinsicH = tempVideo.videoHeight
        const captureW = Math.min(intrinsicW, 320)
        const captureH = (intrinsicH / intrinsicW) * captureW

        const canvas = document.createElement('canvas')
        canvas.width = captureW
        canvas.height = captureH
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(tempVideo, 0, 0, captureW, captureH)

        try {
          const jpegUrl = canvas.toDataURL('image/jpeg', 0.9)
          resolve(jpegUrl)
        } catch {
          resolve('')
        } finally {
          tempVideo.removeEventListener('seeked', onSeek)
          tempVideo.removeEventListener('loadedmetadata', onMeta)
          tempVideo.src = ''
        }
      }

      tempVideo.addEventListener('loadedmetadata', onMeta, { once: true })
      tempVideo.addEventListener('seeked', onSeek, { once: true })
    })

    await (window.api as any).saveCutoutWithThumbnail({
      ...newCutoutFields,
      thumbnailDataUrl: dataUrl
    })

    if (selectedVideoPath) {
      const rows = await window.api.loadCutouts(selectedVideoPath)
      setCutouts(rows)
    }
  }

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  const handleAddCategory = () => {
    const trimmed = newCategory.trim()
    if (trimmed && !allCategories.includes(trimmed)) {
      setAllCategories([...allCategories, trimmed])
      setSelectedCategories([...selectedCategories, trimmed])
      setNewCategory('')
    }
  }

  const handleRemoveCategory = (category: string) => {
    setAllCategories((prev) => prev.filter((c) => c !== category))
    setSelectedCategories((prev) => prev.filter((c) => c !== category))
  }

  return (
    <div className="ms-280 p-4 text-dark" style={{ marginLeft: '280px' }}>
      <h2 className="mb-3 text-dark">{videoName ? videoName : 'Video Editor'}</h2>

      {/* Video Player */}
      <div className="mb-3">
        {selectedVideoPath ? (
          <video
            ref={videoRef}
            src={selectedVideoPath}
            controls
            className="w-100 border rounded"
            onLoadedMetadata={onLoadedMetadata}
          />
        ) : (
          <div className="w-100 border border-secondary rounded bg-light text-center py-5">
            <p className="text-muted">
              <i className="bi bi-camera-reels"></i>
              <br />
              Select a video from the left panel.
            </p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div
        className="bg-white border rounded p-2 mb-5"
        style={{ height: '20px', position: 'relative' }}
      >
        {duration > 0 &&
          cutouts.map((cut, idx) => {
            const leftPct = (cut.start / duration) * 100
            const widthPct = ((cut.end - cut.start) / duration) * 100
            return (
              <div
                key={idx}
                title={cut.label}
                className="bg-brandy-punch position-absolute border rounded"
                style={{
                  height: '100%',
                  top: 0,
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  opacity: 0.7
                }}
              />
            )
          })}
      </div>

      {/* Cutout Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSaveCutout()
        }}
      >
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label text-dark">Name:</label>
            <input
              className="form-control"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Pre (s):</label>
            <input
              type="number"
              step="0.1"
              className="form-control"
              value={pre}
              min={0}
              onChange={(e) => setPre(+e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <label className="form-label">Post (s):</label>
            <input
              type="number"
              step="0.1"
              className="form-control"
              value={post}
              min={0}
              onChange={(e) => setPost(+e.target.value)}
            />
          </div>
          <div className="col-md-5">
            <label className="form-label">Area (1–9):</label>
            <select className="form-select" value={zone} onChange={(e) => setZone(e.target.value)}>
              {Array.from({ length: 9 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} – area
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-10">
            <label className="form-label">Categories:</label>
            <div className="dropdown w-100">
              <button
                className="form-select text-start"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {selectedCategories.length > 0
                  ? selectedCategories.join(', ')
                  : 'Select categories'}
              </button>
              <ul className="dropdown-menu px-3 py-2 w-100" style={{ minWidth: '250px' }}>
                {allCategories.map((cat) => (
                  <li key={cat} className="d-flex align-items-center justify-content-between">
                    <div className="form-check me-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`cat-${cat}`}
                        checked={selectedCategories.includes(cat)}
                        onChange={() => handleCategoryToggle(cat)}
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
                <li>
                  <hr className="dropdown-divider" />
                </li>
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
            </div>
          </div>
          <div className="col-md-2">
            <button className="btn btn-red-damask w-100">Save cutout</button>
          </div>
        </div>
      </form>
    </div>
  )
}
