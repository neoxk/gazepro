import Timestamp from '../timestamp/Timestamp'

interface HandballTSBase extends Timestamp {
  goalPos: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  playerPos: number
  hand: 'LEFT' | 'RIGHT'
}

interface HandballTS extends HandballTSBase {
  id: string
}
