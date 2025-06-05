import { useEffect, useRef, useState } from 'react'
import { Statistics } from './Statistics'

import handballMan from '@renderer/assets/images/handball-man.svg'

interface CutoutRow {
  video_path: string
  start: number
  end: number
  label: string
  zone: number
  position: string
  hand: string
  defended: string
}

interface SeriesFilter {
  zones: number[]
  positions: string[]
  hands: string[]
  defences: string[]
}

export const Training = () => {
  const [seriesFilters, setSeriesFilters] = useState<SeriesFilter[]>([])
  const [clipsPerSeries, setClipsPerSeries] = useState(5)
  const [speed, setSpeed] = useState(1)
  const [pauseBetweenClips, setPauseBetweenClips] = useState(2)
  const [pauseBetweenSeries, setPauseBetweenSeries] = useState(5)
  const [started, setStarted] = useState(false)
  const [cutouts, setCutouts] = useState<CutoutRow[]>([])
  const [currentZone, setCurrentZone] = useState<number | null>(null)
  const [responseZone, setResponseZone] = useState<number | null>(null)
  const [responses, setResponses] = useState<Array<{ expected: number; actual: number; label: string; series: number; position: string }>>([])

  const allPositions = ['Left Wing', 'Right Wing', 'Center', 'Pivot', 'Back Left', 'Back Right']
  const allHands = ['Left', 'Right']
  const allDefences = ['Yes', 'No']

  const addSeries = () => {
      setSeriesFilters([...seriesFilters, { zones: [], positions: [], hands: [], defences: [] }])
    }

  const removeSeries = (index: number) => {
    setSeriesFilters(prev => prev.filter((_, i) => i !== index))
  }

  const getDropdownText = (arr: string[] | number[], placeholder: string) => {
    return arr.length > 0 ? arr.join(', ') : placeholder
  }

  const toggleFilter = <T,>(arr: T[], value: T): T[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]

  const updateFilter = (index: number, field: keyof SeriesFilter, value: any) => {
    setSeriesFilters((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: toggleFilter(copy[index][field], value) }
      return copy
    })
  }

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



    for (let s = 0; s < seriesFilters.length; s++) {
      const { zones, positions, hands, defences } = seriesFilters[s]

          console.log('Hands filter:', hands);
console.log('Cutouts sample:', cutouts.slice(0, 5).map(c => c.hand));


      const matching = cutouts.filter((c) =>
        (zones.length === 0 || zones.includes(c.zone)) &&
        (positions.length === 0 || positions.includes(c.position)) &&
        (hands.length === 0 || hands.map(h => h.toLowerCase()).includes(c.hand.toLowerCase())) &&
        (defences.length === 0 || defences.map(d => d.toLowerCase()).includes(c.defended.toLowerCase()))
      )

      const picks = shuffle([...matching]).slice(0, clipsPerSeries)

      picks.forEach((c, idx) => {
        sequence.push({ url: c.video_path, start: c.start, end: c.end })
        if (idx < picks.length - 1) {
          sequence.push({ delay: pauseBetweenClips })
        }
      })

      if (s < seriesFilters.length - 1) {
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

      const seriesIdx = seriesFilters.findIndex((_, i) => i === currentZone - 1)

      setResponses((prev) => [
        ...prev,
        {
          expected: currentZone,
          actual: responseZone,
          label,
          series: seriesIdx + 1,
          position: allPositions[seriesIdx],
        },
      ])
      setResponseZone(null)
    }
  }

  const handleStart = async () => {
    if (seriesFilters.length === 0) {
      alert('Please add at least one series')
      return
    }

    const cutouts: CutoutRow[] = await (window.api as any).loadAllCutouts()
    setCutouts(cutouts)
    const seq = buildSequence(cutouts);

    const hasClips = seq.some(item => 'url' in item);
    if (!hasClips) {
      alert('No matching clips found for the selected filters.');
      return;
    }

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
        <div className="row mb-4">
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
          <div className="col-md-2">
            <br />
            <button className="btn btn-outline-red-damask mb-3 w-100" onClick={addSeries}>
              Add Series
            </button>
          </div>
        </div>

        {seriesFilters.map((filter, idx) => (
          <div key={idx} className="card p-3 mb-4 position-relative">
            <button
              type="button"
              className="btn-close position-absolute end-0 top-0 m-3"
              aria-label="Close"
              onClick={() => removeSeries(idx)}
            ></button>
            <h5 className="mb-3">Series {idx + 1}</h5>
            <div className="row align-items-end">
              <div className="col-md-6">
                <label className="form-label">Position:</label>
                <div className="dropdown w-100">
                  <button
                    className="form-select text-start"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {getDropdownText(filter.positions, 'Select Position(s)')}
                  </button>
                  <ul
                    className="dropdown-menu px-3 py-2 w-100"
                    style={{ minWidth: '250px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {allPositions.map((pos) => (
                      <li key={pos} className="mb-2">
                        <input
                          type="checkbox"
                          className="btn-check"
                          id={`position-${idx}-${pos}`}
                          autoComplete="off"
                          checked={filter.positions.includes(pos)}
                          onChange={() => updateFilter(idx, 'positions', pos)}
                        />
                        <label className="btn btn-outline-dark w-100" htmlFor={`position-${idx}-${pos}`}>{pos}</label>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label">Area:</label>
                <div className="dropdown w-100">
                  <button
                    className="form-select text-start"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {getDropdownText(filter.zones, 'Select Area(s)')}
                  </button>
                  <ul
                    className="dropdown-menu px-3 py-2 w-100"
                    style={{ minWidth: '250px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {Array.from({ length: 9 }, (_, i) => i + 1).map((zone) => (
                      <li key={zone} className="mb-2">
                        <input
                          type="checkbox"
                          className="btn-check"
                          id={`zone-${idx}-${zone}`}
                          autoComplete="off"
                          checked={filter.zones.includes(zone)}
                          onChange={() => updateFilter(idx, 'zones', zone)}
                        />
                        <label className="btn btn-outline-dark w-100" htmlFor={`zone-${idx}-${zone}`}>{zone}</label>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="col-md-6 mt-3">
                <label className="form-label d-block">Shot Hand:</label>
                <div className="d-flex gap-2">
                  {allHands.map((hand) => (
                    <div className="w-100" key={hand}>
                      <input
                        type="checkbox"
                        className="btn-check"
                        id={`hand-${idx}-${hand}`}
                        autoComplete="off"
                        checked={filter.hands.includes(hand)}
                        onChange={() => updateFilter(idx, 'hands', hand)}
                      />
                      <label className="btn btn-outline-dark w-100" htmlFor={`hand-${idx}-${hand}`}>{hand}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-md-6 mt-3">
                <label className="form-label d-block">Was There Defence?</label>
                <div className="d-flex gap-2">
                  {allDefences.map((d) => (
                    <div className="w-100" key={d}>
                      <input
                        type="checkbox"
                        className="btn-check"
                        id={`def-${idx}-${d}`}
                        autoComplete="off"
                        checked={filter.defences.includes(d)}
                        onChange={() => updateFilter(idx, 'defences', d)}
                      />
                      <label className="btn btn-outline-dark w-100" htmlFor={`def-${idx}-${d}`}>{d}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

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
              className="btn btn-outline-dark w-100"
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
