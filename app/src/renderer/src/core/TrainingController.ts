import { ciIncludes, shuffle } from './util'

interface Filter {
  zones: number[]
  positions: string[]
  hands: string[]
  defences: string[]
}

interface ItrainAPI {
  loadScreen: () => void
  play: (vid_path: string, from: number, to: number, speed: number) => void
  exit: () => void
  pause: () => void
  delay: (seconds: number) => void
  resume: () => void
  onClipFinished: (cb) => void
  onScreenLoaded: (cb) => void
  offScreenLoaded: (cb) => void
  offClipFinished: (cb) => void
}

interface CutoutRow {
  video_path: string
  start: number
  end: number
  label: string
  zone: number
  position: string
  shotHand: string
  defended: string
}

class TrainingController {
  private cutouts: CutoutRow[] = []
  private trainAPI: ItrainAPI
  private filters: Filter[]
  private series: number[]
  private delays: { betweenClips: number; betweenSeries: number }
  private speed: number

  private trainingSequence: Array<Array<CutoutRow | { delay: number }>> = [[]]
  private filteredCutouts: Array<CutoutRow[]> = []

  private currentCutoutIndex: number | null = null
  private currentSeriesIndex: number | null = null

  private isPaused: boolean = false

  private responses: Array<number[]> = [[]]
  private screenExists: boolean = false

  constructor(
    trainAPI: ItrainAPI,
    cutouts: CutoutRow[],
    filters: Filter[],
    series: number[],
    delays: { betweenClips: number; betweenSeries: number },
    speed: number,
    private onCutoutStart: (cutout: CutoutRow, seriesIndex: number) => void,
    private onTrainingEnd: () => void
  ) {
    this.trainAPI = trainAPI
    this.cutouts = cutouts 
    this.filters = filters
    this.series = series
    this.delays = delays
    this.speed = speed

    this.playClip = this.playClip.bind(this)
    this.trainAPI.onClipFinished(() => {
      this.playClip()
    })
  }

  public startTraining() {
    this.filterCutouts()
    this.buildSequence()

    if (this.screenExists) this.exit()
    this.trainAPI.onScreenLoaded(this.playClip)

    this.trainAPI.loadScreen()
    this.screenExists = true

    this.responses = this.series.map((count) => Array(count).fill(0))
  }

  public restartTraining() {
    if (!this.screenExists) {
      this.playClip = this.playClip.bind(this)
      this.trainAPI.onScreenLoaded(this.playClip)
      this.trainAPI.loadScreen()
    }

    this.currentCutoutIndex = null
    this.currentSeriesIndex = null
    this.playClip()
  }


  public pause() {
    this.isPaused = true
    this.trainAPI.pause()
  }

  public resume() {
    this.isPaused = false
    this.trainAPI.resume()
  }

  public nextClip = () => this.playClip({ series: 0, clips: 2 })
  public prevClip = () => this.playClip({ series: 0, clips: -2 })
  public nextSeries = () => this.playClip({ series: 1, clips: 0 })
  public prevSeries = () => this.playClip({ series: -1, clips: 0 })

  public exit() {
    this.trainAPI.offScreenLoaded(this.playClip)
    this.trainAPI.offClipFinished(this.playClip)
    this.trainAPI.exit()
    this.screenExists = false
  }

  public recordResponse(zone: number) {
    if (this.currentSeriesIndex === null || this.currentCutoutIndex === null)
      return console.log('No videos have played yet, response not saved')

    this.responses[this.currentSeriesIndex][this.currentCutoutIndex] = zone
  }

  public getResponses(): Array<number[]> {
    return this.responses
  }

  private filterCutouts() {
    const cutoutsCopy = shuffle([...this.cutouts])
    for (const [seriesIndex, filter] of this.filters.entries()) {
      this.filteredCutouts[seriesIndex] = this.filteredCutouts[seriesIndex] ?? []

      for (const cutout of cutoutsCopy) {
        if (this.filteredCutouts[seriesIndex].length >= this.series[seriesIndex]) break

        if (
          ciIncludes(filter.defences, cutout.defended) &&
          ciIncludes(filter.positions, cutout.position) &&
          ciIncludes(filter.hands, cutout.shotHand) &&
          filter.zones.includes(cutout.zone)
        ) {
          this.filteredCutouts[seriesIndex].push(cutout)
          cutoutsCopy.splice(cutoutsCopy.indexOf(cutout), 1)
        }
        if (this.filteredCutouts[seriesIndex].length >= this.series[seriesIndex]) break
      }
    }
  }

  private buildSequence() {
    this.trainingSequence = Array.from({ length: this.series.length }, () => [])
    this.trainingSequence[0].push({ delay: 5 })

    for (const [i, cutouts] of this.filteredCutouts.entries()) {
      for (const c of cutouts) {
        this.trainingSequence[i].push(c, { delay: this.delays.betweenClips })
      }
      const gap = Math.max(0, this.delays.betweenSeries - this.delays.betweenClips)
      this.trainingSequence[i].push({ delay: gap })
    }
  }

  private advanceClip = (direction: { series: number; clips: number }): boolean => {
    if (this.currentSeriesIndex == null) {
      if (this.trainingSequence.length === 0) return false
      this.currentSeriesIndex = 0
      this.currentCutoutIndex = 0
      return true
    }

    let seriesIdx = this.currentSeriesIndex! + direction.series

    if (seriesIdx < 0 || seriesIdx >= this.trainingSequence.length) return false

    const lenInSeries = (idx: number) => this.trainingSequence[idx]?.length ?? 0
    while (seriesIdx < this.trainingSequence.length && lenInSeries(seriesIdx) === 0) {
      seriesIdx += direction.series >= 0 ? 1 : -1
      if (seriesIdx < 0 || seriesIdx >= this.trainingSequence.length) return false
    }

    let clipIdx = Math.min(
      Math.max(this.currentCutoutIndex!, 0),
      Math.max(lenInSeries(seriesIdx) - 1, 0)
    )

    let remaining = direction.clips

    while (remaining !== 0) {
      if (remaining > 0) {
        const lastIdx = lenInSeries(seriesIdx) - 1
        if (clipIdx < lastIdx) {
          clipIdx++
        } else {
          seriesIdx++
          if (seriesIdx >= this.trainingSequence.length) return false
          while (seriesIdx < this.trainingSequence.length && lenInSeries(seriesIdx) === 0) {
            seriesIdx++
          }
          if (seriesIdx >= this.trainingSequence.length) return false
          clipIdx = 0
        }
        remaining--
      } else {
        if (clipIdx > 0) {
          clipIdx--
        } else {
          seriesIdx--
          if (seriesIdx < 0) return false
          while (seriesIdx >= 0 && lenInSeries(seriesIdx) === 0) {
            seriesIdx--
          }
          if (seriesIdx < 0) return false
          clipIdx = lenInSeries(seriesIdx) - 1
        }
        remaining++
      }
    }

    this.currentSeriesIndex = seriesIdx
    this.currentCutoutIndex = clipIdx
    return true
  }

  private playClip = (direction: { series: number; clips: number } = { series: 0, clips: 1 }) => {
    console.log('Training controller in playClip start')
    if (this.isPaused) return

    if (!this.advanceClip(direction)) {
      this.exit()
      this.onTrainingEnd?.()
      return
    }

    const cur = this.trainingSequence[this.currentSeriesIndex!][this.currentCutoutIndex!]

    if (!cur) {
      this.exit()
      this.onTrainingEnd?.()
      return
    }

    if ('delay' in cur) {
      return this.trainAPI.delay(cur.delay)
    }

    this.onCutoutStart?.(cur, this.currentSeriesIndex!)

    this.trainAPI.play(cur.video_path, cur.start, cur.end, this.speed)
    console.log('sent play command')
  }
}

export default TrainingController
