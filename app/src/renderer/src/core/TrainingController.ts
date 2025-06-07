import { CutoutRow } from "./modules/CutoutsController"

interface Filter {
  hand: number[],
  position: number[],
  zone: number[],
  defense: number[]
}

interface ItrainAPI { 
  loadScreen: () => void
  play: (vid_path: string, from: number, to: number, speed: number) => void
  exit: () => void
  pause: () => void
  delay: (seconds: number) => void,
  onClipFinished: (cb) => void,
  onScreenLoaded: (cb) => void
}


class TrainingController {
  private cutouts: CutoutRow[] = []
  private trainAPI: ItrainAPI
  private filters: Filter[]
  private series: number[]
  private delays: {betweenClips: number, betweenSeries: number}[]
  private speed: number

  private trainingSequence: Array<Array<CutoutRow | {delay: number}>> = [[]]
  private filteredCutouts: Array<CutoutRow[]> = []
  
  private currentCutoutIndex: number | null = null 
  private currentSeriesIndex: number | null = null

  private isPaused: boolean = false;

  constructor(
    trainAPI: ItrainAPI, 
    cutouts: CutoutRow[], 
    filters: Filter[], 
    series: number[], 
    delays: {betweenClips: number, betweenSeries: number}[],
    speed: number) {

    this.trainAPI = trainAPI
    this.cutouts = cutouts
    this.filters = filters
    this.series = series
    this.delays = delays
    this.speed = speed

    this.trainAPI.onClipFinished(this.playClip)
  }

  public startTraining() {
    this.filterCutouts()
    this.buildSequence()

    this.trainAPI.onScreenLoaded(this.playClip)
    this.trainAPI.loadScreen()
  }

  public pause() {
    this.trainAPI.pause()
    this.isPaused = true
  }

  public resume() {
    if (!this.isPaused) return
    this.isPaused = false
    this.playClip()
  }

  public exit() {
    this.trainAPI.exit()
  }

  public recordResponse(zone: number) {

  }

  private filterCutouts() {
    for (const [seriesIndex, filter] of this.filters.entries()) {

      for (const [cutoutIndex, cutout] of this.cutouts.entries()) {
        if (
          cutout.defended in filter.defense &&
          cutout.position in filter.position &&
          cutout.shotHand in filter.hand &&
          cutout.zone in filter.zone
        ) {
          this.filteredCutouts[seriesIndex].push(cutout)
          this.cutouts.splice(cutoutIndex, 1)
        }

        if (this.filteredCutouts[seriesIndex].length >= this.series[seriesIndex]) break;
      }
    }
  }

  private buildSequence() {
    this.trainingSequence[0].push({delay: 5}) //initial delay

    for (const [seriesIndex, cutouts] of this.filteredCutouts.entries()) {

      for (const cutout of cutouts) {
        this.trainingSequence[seriesIndex].push(cutout)
        this.trainingSequence[seriesIndex].push({delay: this.delays[seriesIndex].betweenClips})
      }

      let calculatedBetweenSeriesDelay = this.delays[seriesIndex].betweenSeries - this.delays[seriesIndex].betweenClips 
      this.trainingSequence[seriesIndex].push({
        delay:  calculatedBetweenSeriesDelay > 0 ? calculatedBetweenSeriesDelay : this.delays[seriesIndex].betweenClips
      })
    }
  }

  private advanceClip() {
    if (!this.currentCutoutIndex && !this.currentSeriesIndex) {
      this.currentCutoutIndex = 0
      this.currentSeriesIndex = 0
    } else {
      let currentCutoutIndex = this.currentCutoutIndex!
      let currentSeriesIndex = this.currentSeriesIndex!

      if (currentCutoutIndex == this.series[currentSeriesIndex]) {
        currentSeriesIndex++
        currentCutoutIndex = 0
      } else {
        currentCutoutIndex++
      }

      this.currentCutoutIndex = currentCutoutIndex
      this.currentSeriesIndex = currentSeriesIndex
    }



  }

  private playClip() {
    if (this.isPaused) return 
    this.advanceClip()    

    let currentCutout = this.filterCutouts[this.currentSeriesIndex!][this.currentCutoutIndex!]

    if ('delay' in currentCutout) return this.trainAPI.delay(currentCutout.delay)

    this.trainAPI.play(
      currentCutout.video_path, currentCutout.start, currentCutout.end, this.speed
    )

  }


}

export default TrainingController