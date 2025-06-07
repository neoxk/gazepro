import { ciIncludes } from "./util"

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
  delay: (seconds: number) => void,
  onClipFinished: (cb) => void,
  onScreenLoaded: (cb) => void
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
  private delays: {betweenClips: number, betweenSeries: number}
  private speed: number

  private trainingSequence: Array<Array<CutoutRow | {delay: number}>> = [[]]
  private filteredCutouts: Array<CutoutRow[]> = []
  
  private currentCutoutIndex: number | null = null 
  private currentSeriesIndex: number | null = null

  private isPaused: boolean = false;

  private responses: Array<number[]> = [[]]

  constructor(
    trainAPI: ItrainAPI, 
    cutouts: CutoutRow[], 
    filters: Filter[], 
    series: number[],
    delays: {betweenClips: number, betweenSeries: number},
    speed: number) {

    this.trainAPI = trainAPI
    this.cutouts = cutouts
    this.filters = filters
    this.series = series 
    this.delays = delays
    this.speed = speed

    this.playClip = this.playClip.bind(this)
    this.trainAPI.onClipFinished(() => {
      console.log("clip finished playing + starting new cutout")
      this.playClip()
    })
  }

  public startTraining() {
    this.filterCutouts()
    this.buildSequence()

    this.playClip = this.playClip.bind(this)
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
    if (!this.currentSeriesIndex || !this.currentCutoutIndex) return console.log('No videos have played yet, response not saved')

    this.responses[this.currentSeriesIndex][this.currentCutoutIndex] = zone
  }

  public getResponses(): Array<number[]> {
    return this.responses
  }

  private filterCutouts() {
    for (const [seriesIndex, filter] of this.filters.entries()) {
  
      this.filteredCutouts[seriesIndex] = this.filteredCutouts[seriesIndex] ?? [];
      console.log(this.filters)
  
      for (const cutout of [...this.cutouts]) {
       
        if (this.filteredCutouts[seriesIndex].length >= this.series[seriesIndex]) break;

        if (
          ciIncludes(filter.defences, cutout.defended) &&
          ciIncludes(filter.positions, cutout.position) &&
          ciIncludes(filter.hands,    cutout.shotHand) &&
          filter.zones.includes(cutout.zone)
        ) {
          this.filteredCutouts[seriesIndex].push(cutout);
          this.cutouts.splice(this.cutouts.indexOf(cutout), 1);
        }
        if (this.filteredCutouts[seriesIndex].length >= this.series[seriesIndex]) break;
      }
    }

  }

  private buildSequence() {
    this.trainingSequence = Array.from({ length: this.series.length }, () => []);
    this.trainingSequence[0].push({ delay: 5 });
  
    for (const [i, cutouts] of this.filteredCutouts.entries()) {
      for (const c of cutouts) {
        this.trainingSequence[i].push(c, { delay: this.delays.betweenClips });
      }
      const gap = Math.max(
        0,
        this.delays.betweenSeries - this.delays.betweenClips
      );
      this.trainingSequence[i].push({ delay: gap });
    }

  }

  private advanceClip = (): boolean => {
    if (this.currentSeriesIndex == null) {
      if (this.trainingSequence.length === 0) return false;          
      this.currentSeriesIndex = 0;
      this.currentCutoutIndex = 0;
      return true;
    }
  
    const lastSeriesIdx = this.trainingSequence.length - 1;
    const lastCutoutIdxInCur =
      (this.trainingSequence[this.currentSeriesIndex]?.length ?? 0) - 1;
  
    if (this.currentCutoutIndex! >= lastCutoutIdxInCur) {
      if (this.currentSeriesIndex >= lastSeriesIdx) {
        return false;
      }

      this.currentSeriesIndex++;
      this.currentCutoutIndex = 0;
    } else {
      this.currentCutoutIndex!++;
    }
    return true;
  };


  private playClip = () => {
    if (this.isPaused) return;
  
    if(!this.advanceClip()) return this.trainAPI.exit()
  
    const cur =
      this.trainingSequence[this.currentSeriesIndex!][this.currentCutoutIndex!];

    if (!cur) {
      return this.trainAPI.exit();
    }

  
    
    if ("delay" in cur) {
      return this.trainAPI.delay(cur.delay);
    }
 
    this.trainAPI.play(cur.video_path, cur.start, cur.end, this.speed);
  };


}

export default TrainingController