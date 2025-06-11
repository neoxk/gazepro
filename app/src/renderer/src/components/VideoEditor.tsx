import { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from './Alert'

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
  const [zone, setZone] = useState(1)
  const [shotHand, setShotHand] = useState('left')
  const [defended, setDefended] = useState('no')
  const [position, setPosition] = useState('')
  const [speed, setSpeed] = useState(1)
  const [isPaused, setIsPaused] = useState(false);
  const allPositions = [
    'leftWing',
    'rightWing',
    'center',
    'pivot',
    'backLeft',
    'backRight',
  ]


  const [alert, setAlert] = useState<{
    id: number
    message: string
    type: 'danger' | 'info' | 'success' | 'warning'
  } | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(0)
  
  const [frameRate, setFrameRate] = useState(0)
  
  const [currentTime, setCurrentTime] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [, setFlagMode] = useState(false)
  const [flags, setFlags] = useState<number[]>([])
  const formRef = useRef<HTMLDivElement>(null)

  const { t } = useTranslation();

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

    // console.log(`Loaded video: ${videoName} (probing "${plainPath}" for fps)`)
    // console.log(`Frame rate: ${frameRate} fps`)

    const vid = videoRef.current;
    if (!vid) return;

    const handlePause = () => setIsPaused(true);
    const handlePlay = () => setIsPaused(false);

    vid.addEventListener('pause', handlePause);
    vid.addEventListener('play', handlePlay);

    setIsPaused(vid.paused);

    return () => {
      vid.removeEventListener('pause', handlePause);
      vid.removeEventListener('play', handlePlay);
    };

  }, [selectedVideoPath])

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const update = () => {
      setCurrentTime(vid.currentTime);
      if (!vid.paused && !vid.ended) {
        requestAnimationFrame(update);
      }
    };

    const onPlay = () => requestAnimationFrame(update);
    const onPause = () => setCurrentTime(vid.currentTime);
    const onTimeUpdate = () => setCurrentTime(vid.currentTime);

    vid.addEventListener('play', onPlay);
    vid.addEventListener('pause', onPause);
    vid.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      vid.removeEventListener('play', onPlay);
      vid.removeEventListener('pause', onPause);
      vid.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, []);

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

  const handleSaveCutout = async () => {
    if (!videoRef.current || !selectedVideoPath) return

    if (!label || !zone || !position || !shotHand || !defended) {
      setAlert({
        id: Date.now(),
        message: t('alerts.invalidFields'),
        type: 'danger'
      })
      return
    }

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
        <h2 className="text-dark me-4">{videoName ? videoName : t('videoEditor')}</h2>
      </div>

      {/* Video Player */}
      <div className="mb-3">
        <h6 className="text-end">{t('videoEditorComp.framesPerSecond')}: {Math.ceil(frameRate)}</h6>
        {selectedVideoPath ? (
          <video
            ref={videoRef}
            src={selectedVideoPath}
            className="w-100 border rounded"
            onLoadedMetadata={onLoadedMetadata}
            controls={false}
          />
        ) : (
          <div className="w-100 border border-secondary rounded bg-light text-center py-5">
            <p className="text-muted">
              <i className="bi bi-camera-reels"></i>
              <br />
              {t('videoEditorComp.selectVideo')}
            </p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div
        className="bg-white border rounded p-2 mb-1 position-relative"
        style={{ height: '20px', userSelect: 'none' }}
        onMouseDown={(e) => {
          if (!videoRef.current || !duration) return;
          const bounds = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - bounds.left;
          const clickPct = clickX / bounds.width;
          videoRef.current.currentTime = duration * clickPct;
          setCurrentTime(duration * clickPct);
        }}
        ref={timelineRef}
      >
        {/* CUTOUTS */}
        {duration > 0 &&
          cutouts.map((cut, idx) => {
            const leftPct = (cut.start / duration) * 100;
            const widthPct = ((cut.end - cut.start) / duration) * 100;
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
                  opacity: 0.7,
                }}
              />
            );
          })}

        {/* FLAGS */}
        {duration > 0 &&
          flags.map((time, idx) => {
            const leftPct = (time / duration) * 100;
            return (
              <div
                key={`flag-${idx}`}
                className="position-absolute"
                style={{
                  top: '-20px',
                  left: `calc(${leftPct}% + 1px)`,
                  transform: 'translateX(-50%)', 
                  cursor: 'pointer'
                }}
                title={t('videoEditorComp.clickRemove')}
                onClick={() => setFlags(flags.filter((t) => t !== time))}
              >
                <i className="bi bi-pin-fill"></i>
              </div>
            );
          })}

        {/* PLAYHEAD */}
        <div
          className="position-absolute bg-danger"
          style={{
            width: '2px',
            top: 0,
            bottom: 0,
            left: `${(currentTime / duration) * 100}%`,
            zIndex: 10,
            cursor: 'pointer',
          }}
          onMouseDown={() => {
            const timeline = timelineRef.current;
            if (!videoRef.current || !timeline) return;
            const bounds = timeline.getBoundingClientRect();

            const onMouseMove = (e: MouseEvent) => {
              const x = e.clientX - bounds.left;
              const pct = Math.min(Math.max(x / bounds.width, 0), 1);
              const newTime = duration * pct;
              videoRef.current!.currentTime = newTime;
              setCurrentTime(newTime);
            };

            const onMouseUp = () => {
              window.removeEventListener('mousemove', onMouseMove);
              window.removeEventListener('mouseup', onMouseUp);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
          }}
        />
      </div>

      {/* Custom Video Controls */}
      <div className="d-flex justify-content-center align-items-center gap-3 mb-3 mt-4">
        <button
          type="button"
          className="btn btn-outline-dark border-0 px-4"
          onClick={() => {
            const vid = videoRef.current
            if (vid) vid.currentTime = Math.max(0, vid.currentTime - 10)
          }}
        >
          <i className="bi bi-skip-backward-fill me-2"></i> 10s
        </button>

        <button
          type="button"
          className="btn border-0 fs-1 text-red-damask"
          onClick={() => {
            const vid = videoRef.current
            if (!vid) return
            if (vid.paused) {
              vid.play()
              setIsPaused(false)
            } else {
              vid.pause()
              setIsPaused(true)
            }
          }}
        >
          <i className={`bi ${isPaused ? 'bi-play-fill' : 'bi-pause-fill'}`}></i>
        </button>

        <button
          type="button"
          className="btn btn-outline-dark border-0 px-4"
          onClick={() => {
            const vid = videoRef.current
            if (vid) vid.currentTime = Math.min(vid.duration, vid.currentTime + 10)
          }}
        >
          10s <i className="ms-2 bi bi-skip-forward-fill"></i>
        </button>
      </div>

      {/* Frame Stepping Buttons */}
      <div className="d-flex justify-content-center align-items-center gap-3 m-4">
        <button
          type="button"
          className="btn btn-outline-dark px-5 border-0"
          onClick={stepBackward}
          disabled={frameRate <= 0}
        >
          <i className="bi bi-caret-left"></i> {t('videoEditorComp.frame')}
        </button>
        
        <button
          type="button"
          className="btn text-red-damask border-0"
          disabled={isPaused !== true}
          onClick={() => {
            const vid = videoRef.current
            if (!vid) return
            const time = vid.currentTime
            
            setFlags([...flags, time])
            setAlert({
              id: Date.now(),
              message: t('alerts.flagInfo'),
              type: 'info'
            })
            setCurrentTime(time);
            setFlagMode(false)
            setTimeout(() => {
              formRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 300)
          }}
        >
          <i className="bi bi-flag-fill fs-3"></i>
        </button>
        <button
          type="button"
          className="btn btn-outline-dark px-5 border-0"
          onClick={stepForward}
          disabled={frameRate <= 0}
        >
          {t('videoEditorComp.frame')} <i className="bi bi-caret-right"></i>
        </button>
      </div>

      {/* Speed Slider */}
      <div className="mt-4 w-25 ms-auto text-end">
        <label className="form-label small">{t('videoEditorComp.playbackSpeed')}: {speed.toFixed(1)}x</label>
        <input
          type="range"
          className="form-range"
          min="0.5"
          max="2"
          step="0.1"
          value={speed}
          onChange={(e) => {
            const newSpeed = parseFloat(e.target.value)
            setSpeed(newSpeed)
            if (videoRef.current) videoRef.current.playbackRate = newSpeed
          }}
        />
      </div>

      {/* Cutout Form */}
      <div ref={formRef}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSaveCutout()
          }}
        >
          <div className="row g-3 mt-5 align-items-end">
            <div className="col-md-4">
              <label className="form-label text-dark">{t('videoEditorComp.name')}:</label>
              <input
                className="form-control"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">{t('videoEditorComp.pre')}:</label>
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
              <label className="form-label">{t('videoEditorComp.post')}:</label>
              <input
                type="number"
                step="0.1"
                className="form-control"
                value={post}
                min={0}
                onChange={(e) => setPost(+e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">{t('videoEditorComp.area')}:</label>
              <div className="dropdown w-100">
                <button
                  className="form-select text-start"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {zone ? `${t('videoEditorComp.area')} ${zone}` : t('videoEditorComp.selectArea')}
                </button>
                <ul
                  className="dropdown-menu px-3 py-2 w-100"
                  style={{ minWidth: '250px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {Array.from({ length: 9 }, (_, i) => (
                    <li key={i + 1} className="mb-2">
                      <input
                        type="radio"
                        className="btn-check"
                        name="zone"
                        id={`zone-${i + 1}`}
                        autoComplete="off"
                        checked={zone === i + 1}
                        onChange={() => setZone(i + 1)}
                      />
                      <label className="btn btn-outline-dark w-100" htmlFor={`zone-${i + 1}`}>
                        {i + 1}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label">{t('videoEditorComp.position')}:</label>
              <div className="dropdown w-100">
                <button
                  className="form-select text-start"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {position ? t(`positions.${position}`) : t('videoEditorComp.selectPosition')}
                </button>
                <ul 
                  className="dropdown-menu px-3 py-2 w-100" 
                  style={{ minWidth: '250px' }}
                  onClick={(e) => e.stopPropagation()}  
                >
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
                        {t(`positions.${pos}`)}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label d-block">{t('hands.shotHand')}:</label>
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
                    {t('hands.left')}
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
                    {t('hands.right')}
                  </label>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <label className="form-label d-block">{t('defended.wasThereDefence')}</label>
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
                    {t('defended.yes')}
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
                    {t('defended.no')}
                  </label>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <button className="btn btn-red-damask w-100">{t('videoEditorComp.saveCutout')}</button>
            </div>
          </div>
        </form>
      </div>
      {alert && (
        <Alert
          key={alert.id}
          message={alert.message}
          type={alert.type}
        />
      )}
    </div>
  )
}
