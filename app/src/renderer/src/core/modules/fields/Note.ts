interface INote {
  note: string
}

class Note implements Field {
  readonly uiId = 'NOTE'
  readonly colName = 'note'
  readonly colType = 'text'

  private _val: any | null = null

  set val(newVal: any) {
    if (!(newVal instanceof String)) throw new Error('Note should be a string')

    this._val = newVal
  }

  get val() {
    if (this._val === null) throw new Error('Note val has not been set')

    return this._val
  }

  public serialize(): [x: string, y: any] {
    if (this._val === null) throw new Error('You must set the value of Note before serializing')
    return [this.colName, this._val]
  }
}

export { Note }
export type { INote }
