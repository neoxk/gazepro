import { Field } from './Field'

interface IHandedness {
  goal_pos: number
}

class Handedness implements Field {
  readonly uiId = 'HANDEDNESS'
  readonly colName = 'handedness'
  readonly colType = 'integer'

  private _val: number | null = null

  set val(newVal: number) {
    if (isNaN(newVal) || (newVal !== 0 && newVal !== 1))
      throw new Error('Handedness is a value 0 - right handed or 1 - left handed')

    this._val = newVal
  }

  get val() {
    if (this._val === null) throw new Error('You must set the value of Handedness before reading')

    return this._val
  }

  public serialize(): [colName: string, val: number] {
    if (this._val === null)
      throw new Error('You must set the value of Handedness before serializing')
    return [this.colName, this._val]
  }
}

export { Handedness }
export type { IHandedness }
