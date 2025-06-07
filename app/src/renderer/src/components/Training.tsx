import { useEffect, useRef, useState } from 'react'

import handballMan from '@renderer/assets/images/handball-man.svg'
import TrainingController from '../core/TrainingController'
import { ipcMain } from 'electron'

interface cutoutrow {
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
  const [cutouts, setCutouts] = useState<cutoutrow[]>([])
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
      }
    }


    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)

  }, [started, currentZone, responseZone])


  function handleStart() {
    let seriesArray: number[] = []
    for (let i = 0; i < seriesFilters.length; i++) seriesArray.push(clipsPerSeries)

    const trainingController = new TrainingController(
      (window as any).trainAPI,
      cutouts,
      seriesFilters,
      seriesArray,
      {betweenClips: pauseBetweenClips, betweenSeries: pauseBetweenSeries},
      speed
    )

    trainingController.startTraining()
  }

  


  const handleRestart = () => {
    // setStarted(false)
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

      </form>
    </div>
  )
}