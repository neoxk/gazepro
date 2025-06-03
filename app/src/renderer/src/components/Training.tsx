import { useEffect, useRef, useState } from 'react'
import handballMan from '@renderer/assets/images/handball-man.svg'
import { Statistics } from './Statistics'

interface CutoutRow {
  video_path: string
  start: number
  end: number
  label: string
  zone: number
  categories: string[]
}

export const Training = () => {
  const [seriesCount, setSeriesCount] = useState(3)
  const [clipsPerSeries, setClipsPerSeries] = useState(5)
  const [speed, setSpeed] = useState(1)
  const [pauseBetweenClips, setPauseBetweenClips] = useState(2)
  const [pauseBetweenSeries, setPauseBetweenSeries] = useState(5)
  const [started, setStarted] = useState(false)
  const [cutouts, setCutouts] = useState<CutoutRow[]>([])
  const [currentZone, setCurrentZone] = useState<number | null>(null)
  const [responseZone, setResponseZone] = useState<number | null>(null)
  const [responses, setResponses] = useState<Array<{ expected: number; actual: number; label: string; series: number; category: string }>>([])

  const allCategories = ['Reflex', 'Positioning', 'Reactions']
  const [seriesCategories, setSeriesCategories] = useState<string[]>(
    Array(seriesCount).fill('')
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!started || currentZone === null) return

      if (e.key >= '1' && e.key <= '9') {
        setResponseZone(Number(e.key))
      }

      if (e.key === 'Enter' && responseZone !== null) {
        recordResponse()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [started, currentZone, responseZone])

  const videoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)

  const updateSeriesCount = (n: number) => {
    setSeriesCount(n)
    setSeriesCategories((cats) =>
      Array(n)
        .fill('')
        .map((_, i) => cats[i] || '')
    )
  }

  const handleCategoryChange = (idx: number, cat: string) => {
    setSeriesCategories((cats) => {
      const copy = [...cats]
      copy[idx] = cat
      return copy
    })
  }

  const shuffle = <T,>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  const buildSequence = (cutouts: CutoutRow[]) => {
    const sequence: Array<{ url: string; start: number; end: number } | { delay: number }> =
      []

    for (let s = 0; s < seriesCount; s++) {
      const cat = seriesCategories[s]
      const matching = cutouts.filter((c) => c.categories.includes(cat))
      const picks = shuffle([...matching]).slice(0, clipsPerSeries)

      picks.forEach((c, idx) => {
        sequence.push({ url: c.video_path, start: c.start, end: c.end })
        if (idx < picks.length - 1) {
          sequence.push({ delay: pauseBetweenClips })
        }
      })

      if (s < seriesCount - 1) {
        sequence.push({ delay: pauseBetweenSeries })
      }
    }

    return sequence
  }

  const playSequence = async (
    seq: Array<{ url: string; start: number; end: number } | { delay: number }>,
    cutouts: CutoutRow[]
  ) => {
    const vid = videoRef.current!
    for (const item of seq) {
      if ('delay' in item) {
        vid.pause()
        await new Promise((r) => setTimeout(r, item.delay * 1000))
      } else {
        
        const matched = cutouts.find(c => c.video_path === item.url && c.start === item.start && c.end === item.end)
        if (matched?.zone) {
          setCurrentZone(matched.zone)
          videoRef.current?.setAttribute('data-label', matched.label)
        } else {
          setCurrentZone(null)
        }


        vid.src = item.url
        vid.playbackRate = speed
        await new Promise<void>((resolve) => {
          const onLoaded = () => {
            vid.currentTime = item.start
            vid.play()
          }
          const onTimeUpdate = () => {
            if (vid.currentTime >= item.end) {
              vid.pause()
              vid.removeEventListener('timeupdate', onTimeUpdate)
              vid.removeEventListener('loadedmetadata', onLoaded)
              resolve()
            }
          }
          vid.addEventListener('loadedmetadata', onLoaded, { once: true })
          vid.addEventListener('timeupdate', onTimeUpdate)
        })
      }
    }
    setStarted(false)
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }

  const recordResponse = () => {
    if (currentZone !== null && responseZone !== null) {
      const label = videoRef.current?.getAttribute('data-label') ?? ''
      const matched = cutouts.find(c => c.label === label)

      const seriesIdx = seriesCategories.findIndex(cat =>
        matched?.categories.includes(cat)
      )

      setResponses((prev) => [
        ...prev,
        {
          expected: currentZone,
          actual: responseZone,
          label,
          series: seriesIdx + 1,
          category: seriesCategories[seriesIdx],
        },
      ])
      setResponseZone(null)
    }
  }

  const handleStart = async () => {
    if (seriesCategories.some((c) => !c)) {
      alert('Please select a category for every series')
      return
    }

    const cutouts: CutoutRow[] = await (window.api as any).loadAllCutouts()
    setCutouts(cutouts)
    const seq = buildSequence(cutouts)

    setStarted(true)
    setTimeout(() => {
      videoContainerRef.current?.requestFullscreen().catch(() => {})
    }, 100)

    await playSequence(seq, cutouts)
  }

  const handleRestart = () => {
    setStarted(false)
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }

  return (
    <div className="container mt-5 text-dark position-relative" style={{ zIndex: 1 }}>
      <img src={handballMan} alt="Handball Background" className="handball-bg" />
      <h2 className="mb-3 text-dark">Training Module</h2>

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="row g-3 mb-4">
          <div className="col-md-2">
            <label>Series</label>
            <input
              type="number"
              className="form-control"
              value={seriesCount}
              min={1}
              onChange={(e) => updateSeriesCount(+e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label>Clips/Series</label>
            <input
              type="number"
              className="form-control"
              value={clipsPerSeries}
              min={1}
              onChange={(e) => setClipsPerSeries(+e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label>Speed</label>
            <input
              type="number"
              className="form-control"
              value={speed}
              min={0.5}
              max={2}
              step={0.1}
              onChange={(e) => setSpeed(+e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label>Pause Between Clips (s)</label>
            <input
              type="number"
              className="form-control"
              value={pauseBetweenClips}
              min={0}
              onChange={(e) => setPauseBetweenClips(+e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label>Pause Between Series (s)</label>
            <input
              type="number"
              className="form-control"
              value={pauseBetweenSeries}
              min={0}
              onChange={(e) => setPauseBetweenSeries(+e.target.value)}
            />
          </div>
        </div>

        <div className="row mb-4">
          {Array.from({ length: seriesCount }).map((_, idx) => (
            <div className="col-md-4 mb-3" key={idx}>
              <label>Series {idx + 1} Category</label>
              <select
                className="form-select"
                value={seriesCategories[idx] || ''}
                onChange={(e) => handleCategoryChange(idx, e.target.value)}
              >
                <option value="">Select…</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="row mb-4">
          <div className="col-md-6">
            <button
              type="button"
              className="btn btn-red-damask w-100"
              onClick={handleStart}
              disabled={started}
            >
              Start Training
            </button>
          </div>
          <div className="col-md-6">
            <button
              type="button"
              className="btn btn-secondary w-100"
              onClick={handleRestart}
            >
              Restart
            </button>
          </div>
        </div>

        <div ref={videoContainerRef} className={started ? 'video-fullscreen-wrapper' : ''} style={{ position: 'relative' }}>
          <video
            ref={videoRef}
            controls
            style={{
              width: '100%',
              height: started ? '100vh' : 'auto',
              objectFit: 'contain'
            }}
          />

          {currentZone !== null && started && (
            <div
              className="position-absolute top-0 end-0 bg-white border rounded p-3 shadow"
              style={{
                zIndex: 10,
                width: '250px',
                margin: '1rem',
                pointerEvents: 'auto',
                opacity: 0.95
              }}
            >
              <h6>Expected Zone: {currentZone}</h6>
              <label className="form-label">Actual Defended Zone</label>
              <input
                type="text"
                className="form-control mb-2"
                min={1}
                max={9}
                value={responseZone ?? ''}
                onChange={(e) => setResponseZone(Number(e.target.value))}
              />
              <button
                className="btn btn-sm btn-outline-red-damask w-100"
                onClick={recordResponse}
                disabled={responseZone === null}
              >
                Submit Response
              </button>
            </div>
          )}

          {!started && responses.length > 0 && (
            <Statistics responses={responses} />
          )}
        </div>
      </form>
    </div>
  )
}
