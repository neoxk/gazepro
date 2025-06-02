import { Field } from './Field'

interface IPlayerPos {
  player_pos: number
}

class PlayerPos implements Field {
  readonly uiId = 'PLAYER_POS'
  readonly colName = 'player_pos'
  readonly colType = 'integer'

  private _val: number | null = null

  set val(newVal: number) {
    if (isNaN(newVal) || newVal < 1 || newVal > 6)
      throw new Error('PlayerPos val should be a number from 1 through 6')

    this._val = newVal
  }

  get val() {
    if (this._val === null) throw new Error('PlayerPos val has not been set')

    return this._val
  }

  public serialize(): [x: string, y: number] {
    if (this._val === null)
      throw new Error('You must set the value of PlayerPos before serializing')
    return [this.colName, this._val]
  }
}

export { PlayerPos }
export type { IPlayerPos }
