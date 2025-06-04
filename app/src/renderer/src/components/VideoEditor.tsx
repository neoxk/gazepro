import { useRef, useState, useEffect } from 'react'

declare global {
  interface Window {
    api: {
      loadCutouts: (videoPath: string) => Promise<Cutout[]>
      saveCutout: (cutout: any) => Promise<void>
      getFrameRate: (filePath: string) => Promise<{ fps: number }>
    }
  }
}

interface Cutout {
  start: number
  end: number
  label: string
  categories: string[]
}

interface Props {
  selectedVideoPath: string | null
}

export const VideoEditor = ({ selectedVideoPath }: Props) => {
  const [cutouts, setCutouts] = useState<Cutout[]>([])
  const [pre, setPre] = useState(2)
  const [post, setPost] = useState(2)
  const [label, setLabel] = useState('Snippet')
  const [zone, setZone] = useState('1')
  const [shotHand, setShotHand] = useState('left')
  const [defended, setDefended] = useState('no')
  const [position, setPosition] = useState('')
  const allPositions = ['Left Wing', 'Right Wing', 'Center', 'Pivot', 'Back Left', 'Back Right']

  const videoRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(0)

  const [frameRate, setFrameRate] = useState(0)

  const videoName = selectedVideoPath ? selectedVideoPath.split(/[/\\]+/).pop() : null

  useEffect(() => {
    if (!selectedVideoPath) {
      setCutouts([])
      setDuration(0)
      return
    }

    window.api.loadCutouts(selectedVideoPath).then((rows) => setCutouts(rows))

    let plainPath = selectedVideoPath
    if (plainPath.startsWith('file://')) {
      plainPath = plainPath.replace(/^file:\/\//, '')
      if (process.platform === 'win32' && plainPath.startsWith('/')) {
        plainPath = plainPath.slice(1)
      }
    }

    window.api
      .getFrameRate(plainPath)
      .then(({ fps }) => {
        if (fps > 0 && Number.isFinite(fps)) {
          setFrameRate(fps)
        } else {
          console.warn('Invalid frame rate returned:', fps)
        }
      })
      .catch((err) => {
        console.error('Error probing frame rate:', err)
      })

    console.log(`Loaded video: ${videoName} (probing "${plainPath}" for fps)`)
    console.log(`Frame rate: ${frameRate} fps`)
  }, [selectedVideoPath])

  const onLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
    console.log(`Frame rate: ${frameRate} fps`)
  }

  const stepBackward = () => {
    const vid = videoRef.current
    if (!vid || frameRate <= 0) return
    vid.pause()
    const FRAME_STEP = 1 / frameRate
    vid.currentTime = Math.max(0, vid.currentTime - FRAME_STEP)
  }

  const stepForward = () => {
    const vid = videoRef.current
    if (!vid || frameRate <= 0) return
    vid.pause()
    const FRAME_STEP = 1 / frameRate
    vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + FRAME_STEP)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        stepBackward()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        stepForward()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [frameRate])

  const handleSaveCutout = async () => {
    if (!videoRef.current || !selectedVideoPath) return

    const current = videoRef.current.currentTime
    const newCutoutFields = {
      video_path: selectedVideoPath,
      start: Math.max(0, current - pre),
      end: current + post,
      label: `${label}`,
      zone: Number(zone),
      shotHand: shotHand,
      defended: defended,
      position: position
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

  return (
    <div className="ms-280 p-4 text-dark" style={{ marginLeft: '280px' }}>
      <div className="d-flex align-items-center mb-3">
        <h2 className="text-dark me-4">{videoName ? videoName : 'Video Editor'}</h2>
        <h5>Fps: {frameRate}</h5>
      </div>

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
        className="bg-white border rounded p-2 mb-1"
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

      <div className="d-flex justify-content-center align-items-center gap-3 mt-2 mb-3">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={stepBackward}
          disabled={frameRate <= 0}
        >
          ◀︎ Frame
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={stepForward}
          disabled={frameRate <= 0}
        >
          Frame ▶︎
        </button>
      </div>

      {/* Cutout Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSaveCutout()
        }}
      >
        <div className="row g-3 align-items-end">
          <div className="col-md-5">
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
          <div className="col-md-3">
            <label className="form-label">Area (1–9):</label>
            <select className="form-select" value={zone} onChange={(e) => setZone(e.target.value)}>
              {Array.from({ length: 9 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} – area
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-5">
            <label className="form-label">Position:</label>
            <div className="dropdown w-100">
              <button
                className="form-select text-start"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {position || 'Select Position'}
              </button>
              <ul className="dropdown-menu px-3 py-2 w-100" style={{ minWidth: '250px' }}>
                {allPositions.map((pos) => (
                  <li key={pos} className="mb-2">
                    <input
                      type="radio"
                      className="btn-check"
                      name="position"
                      id={`pos-${pos}`}
                      autoComplete="off"
                      checked={position === pos}
                      onChange={() => setPosition(pos)}
                    />
                    <label className="btn btn-outline-dark w-100" htmlFor={`pos-${pos}`}>
                      {pos}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="col-md-2">
            <label className="form-label d-block">Shot Hand:</label>
            <div className="d-flex gap-2">
              <div className="w-100">
                <input
                  type="radio"
                  className="btn-check"
                  name="hand"
                  id="hand-left"
                  autoComplete="off"
                  checked={shotHand === 'left'}
                  onChange={() => setShotHand('left')}
                />
                <label className="btn btn-outline-dark w-100" htmlFor="hand-left">
                  Left
                </label>
              </div>
              <div className="w-100">
                <input
                  type="radio"
                  className="btn-check"
                  name="hand"
                  id="hand-right"
                  autoComplete="off"
                  checked={shotHand === 'right'}
                  onChange={() => setShotHand('right')}
                />
                <label className="btn btn-outline-dark w-100" htmlFor="hand-right">
                  Right
                </label>
              </div>
            </div>
          </div>

          <div className="col-md-2">
            <label className="form-label d-block">Was There Defence?</label>
            <div className="d-flex gap-2">
              <div className="w-100">
                <input
                  type="radio"
                  className="btn-check"
                  name="defence"
                  id="defence-yes"
                  autoComplete="off"
                  checked={defended === 'yes'}
                  onChange={() => setDefended('yes')}
                />
                <label className="btn btn-outline-dark w-100" htmlFor="defence-yes">
                  Yes
                </label>
              </div>
              <div className="w-100">
                <input
                  type="radio"
                  className="btn-check"
                  name="defence"
                  id="defence-no"
                  autoComplete="off"
                  checked={defended === 'no'}
                  onChange={() => setDefended('no')}
                />
                <label className="btn btn-outline-dark w-100" htmlFor="defence-no">
                  No
                </label>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <button className="btn btn-red-damask w-100">Save cutout</button>
          </div>
        </div>
      </form>
    </div>
  )
}
