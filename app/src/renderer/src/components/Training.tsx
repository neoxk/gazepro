import { useEffect, useRef, useState } from 'react'
import { Statistics } from './Statistics'
import { Alert } from './Alert'
import { useTranslation } from 'react-i18next'

import handballMan from '@renderer/assets/images/handball-man.svg'
import TrainingController from '../core/TrainingController'

interface cutoutrow {
  video_path: string
  start: number
  end: number
  label: string
  zone: number
  position: string
  shotHand: string
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
  const [responses, setResponses] = useState<
    Array<{ expected: number; actual: number; label: string; series: number; position: string }>
  >([])
  const [alert, setAlert] = useState<{
    id: number
    message: string
    type?: 'danger' | 'info' | 'success' | 'warning'
  } | null>(null)

  const [showStats, setShowStats] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const allPositions = ['leftWing', 'rightWing', 'center', 'pivot', 'backLeft', 'backRight'];
  const allHands = ['left', 'right'];
  const allDefences = ['yes', 'no'];

  const trainingControllerRef = useRef<TrainingController>(null)
  
  const { t } = useTranslation();

  const addSeries = () => {
    setSeriesFilters([...seriesFilters, { zones: [], positions: [], hands: [], defences: [] }])
  }

  const removeSeries = (index: number) => {
    setSeriesFilters((prev) => prev.filter((_, i) => i !== index))
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

  const selectAllFilter = <T,>(index: number, field: keyof SeriesFilter, allOptions: T[]) => {
    setSeriesFilters((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: [...allOptions] }
      return copy
    })
  }

  useEffect(() => {
    ;(window as any).api.loadAllCutouts().then((cutouts) => setCutouts(cutouts))
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!started || currentZone === null) return

      if (e.key >= '1' && e.key <= '9') {
        setResponseZone(Number(e.key))
      }

      if (e.key === 'Enter' && responseZone !== null) {
        setResponses((prev) => {
          const copy = [...prev]
          copy[copy.length - 1].actual = responseZone
          return copy
        })
        setResponseZone(null)
        setCurrentZone(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [started, currentZone, responseZone])

  function handleStart() {
    trainingControllerRef.current = null
    setCurrentZone(null)
    setResponseZone(null)
    setResponses([])

    if (seriesFilters.length === 0) {
      setAlert({
        id: Date.now(),
        message: t('alerts.noSeries'),
        type: 'danger'
      })

      return
    }

    const unfiltered = seriesFilters.some(
      (s) =>
        s.positions.length === 0 &&
        s.zones.length === 0 &&
        s.hands.length === 0 &&
        s.defences.length === 0
    )

    if (unfiltered) {
      setAlert({
        id: Date.now(),
        message: t('alerts.seriesFilterSet'),
        type: 'danger'
      })
      return
    }

    let seriesArray: number[] = []
    for (let i = 0; i < seriesFilters.length; i++) seriesArray.push(clipsPerSeries)

    if(!trainingControllerRef.current) 
      trainingControllerRef.current = new TrainingController(
      (window as any).trainAPI,
      cutouts,
      seriesFilters,
      seriesArray,
      { betweenClips: pauseBetweenClips, betweenSeries: pauseBetweenSeries },
      speed,
      (cutout, currentSeries) => {
        setCurrentZone(cutout.zone)
        setResponses((prev) => [
          ...prev,
          {
            expected: cutout.zone,
            actual: 0,
            label: cutout.label,
            series: currentSeries,
            position: cutout.position
          }
        ])
      },
      () => {
        setStarted(false)
        setCurrentZone(null)
        setResponseZone(null)
      }
    )

    setStarted(true)
    trainingControllerRef.current.startTraining()
  }

  const handleRestart = () => {
    setCurrentZone(null)
    setResponseZone(null)
    setResponses([])
    trainingControllerRef.current?.restartTraining()
  }

  return (
    <div className="container mt-5 text-dark position-relative" style={{ zIndex: 1 }}>
      <img src={handballMan} alt="Handball Background" className="handball-bg" />
      <h2 className="mb-3 text-dark">{t('trainingModule')}</h2>

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="row mb-4">
          <div className="col-md-2">
            <label>{t('trainingComp.clipsPerSeries')}</label>
            <input
              type="number"
              className="form-control"
              value={clipsPerSeries}
              min={1}
              onChange={(e) => setClipsPerSeries(+e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label>{t('trainingComp.speed')}</label>
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
            <label>{t('trainingComp.pauseClips')}</label>
            <input
              type="number"
              className="form-control"
              value={pauseBetweenClips}
              min={0}
              onChange={(e) => setPauseBetweenClips(+e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label>{t('trainingComp.pauseSeries')}</label>
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
              {t('trainingComp.addSeries')}
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
            <h5 className="mb-3">{t('trainingComp.series')} {idx + 1}</h5>
            <div className="row align-items-end">
              <div className="col-md-6">
                <label className="form-label">{t('positions.position')}:</label>
                <div className="dropdown w-100">
                  <button
                    className="form-select text-start"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {getDropdownText(filter.positions.map(p => t(`positions.${p}`)), t('trainingComp.selectPositions'))}
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
                        <label
                          className="btn btn-outline-dark w-100"
                          htmlFor={`position-${idx}-${pos}`}
                        >
                          {t(`positions.${pos}`)}
                        </label>
                      </li>
                    ))}
                    <li className="mb-2">
                      <button
                        type="button"
                        className="btn btn-outline-dark w-100"
                        onClick={() => selectAllFilter(idx, 'positions', allPositions)}
                      >
                        {t('trainingComp.selectAll')}
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label">{t('positions.position')}:</label>
                <div className="dropdown w-100">
                  <button
                    className="form-select text-start"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {getDropdownText(filter.zones, t('trainingComp.selectAreas'))}
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
                        <label
                          className="btn btn-outline-dark w-100"
                          htmlFor={`zone-${idx}-${zone}`}
                        >
                          {zone}
                        </label>
                      </li>
                    ))}
                    <li className="mb-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-dark w-100"
                        onClick={() => selectAllFilter(idx, 'zones', [1, 2, 3, 4, 5, 6, 7, 8, 9])}
                      >
                        {t('trainingComp.selectAll')}
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="col-md-6 mt-3">
                <label className="form-label d-block">{t('hands.shotHand')}:</label>
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
                      <label className="btn btn-outline-dark w-100" htmlFor={`hand-${idx}-${hand}`}>
                        {t(`hands.${hand}`)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-md-6 mt-3">
                <label className="form-label d-block">{t('defended.wasThereDefence')}</label>
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
                      <label className="btn btn-outline-dark w-100" htmlFor={`def-${idx}-${d}`}>
                        {t(`defended.${d}`)}
                      </label>
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
              {t('trainingComp.startTraining')}
            </button>
          </div>
          <div className="col-md-6">
            <button type="button" className="btn btn-outline-dark w-100" onClick={handleRestart}>
              {t('trainingComp.restart')}
            </button>
          </div>
        </div>
      </form>

      {started && (
        <div className="d-flex justify-content-center align-items-center my-5">
          <button
            className="btn btn-outline-dark border-0 px-4"
            onClick={() => trainingControllerRef.current?.prevSeries()}
          >
            {t('trainingComp.prevSeries')}
          </button>
          <button
            className="btn btn-outline-dark border-0 px-4"
            onClick={() => trainingControllerRef.current?.prevClip()}
          >
            {t('trainingComp.prevClip')}
          </button>

          <button
            type="button"
            className="btn border-0 fs-1 text-red-damask"
            onClick={() => {
              if (!isPaused) {
                trainingControllerRef.current?.pause()
                setIsPaused(true)
              } else {
                trainingControllerRef.current?.resume()
                setIsPaused(false)
              }
            }}
          >
            <i className={`bi ${isPaused ? 'bi-play-fill' : 'bi-pause-fill'}`}></i>
          </button>

          <button
            className="btn btn-outline-dark border-0 px-4"
            onClick={() => trainingControllerRef.current?.nextClip()}
          >
            {t('trainingComp.nextClip')}
          </button>
          <button
            className="btn btn-outline-dark border-0 px-4"
            onClick={() => trainingControllerRef.current?.nextSeries()}
          >
           {t('trainingComp.nextSeries')}
          </button>
        </div>
      )}

      {started && currentZone !== null && (
        <div className="alert alert-danger mt-4">
          <strong>{t('trainingComp.expected')}:</strong> {currentZone}
          <div className="mt-2">
            <label htmlFor="zoneInput" className="form-label">
              {t('trainingComp.enterActual')}
            </label>
            <input
              type="number"
              id="zoneInput"
              className="form-control"
              min={1}
              max={9}
              value={responseZone ?? ''}
              onChange={(e) => {
                const val = Number(e.target.value)
                if (val >= 1 && val <= 9) setResponseZone(val)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && responseZone !== null) {
                  setResponses((prev) => {
                    const copy = [...prev]
                    copy[copy.length - 1].actual = responseZone
                    return copy
                  })
                  setResponseZone(null)
                  setCurrentZone(null)
                }
              }}
            />
          </div>
        </div>
      )}

      {!started && responses.length > 0 && (
        <div className="card mt-4 p-3">
          <h4>{t('trainingComp.reviewResponses')}</h4>
          <div className="table-responsive">
            <table className="table table-bordered mt-3">
              <thead className="bg-light">
                <tr>
                  <th>#</th>
                  <th>{t('trainingComp.expected')}</th>
                  <th>{t('trainingComp.actual')}</th>
                  <th>{t('trainingComp.label')}</th>
                  <th>{t('positions.position')}</th>
                  <th>{t('trainingComp.series')}</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((resp, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{resp.expected}</td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        max={9}
                        value={resp.actual}
                        onChange={(e) => {
                          const newVal = Number(e.target.value)
                          setResponses((prev) => {
                            const copy = [...prev]
                            copy[i].actual = newVal
                            return copy
                          })
                        }}
                      />
                    </td>
                    <td>{resp.label}</td>
                    <td>{resp.position}</td>
                    <td>{resp.series + 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="btn btn-outline-red-damask mt-3"
            onClick={() => setShowStats((prev) => !prev)}
          >
            {showStats ? t('trainingComp.hideStats') : t('trainingComp.showStats')}
          </button>

          {showStats && <Statistics responses={responses} />}
        </div>
      )}

      {alert && <Alert key={alert.id} message={alert.message} type={alert.type} />}
    </div>
  )
}
