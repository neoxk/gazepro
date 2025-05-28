interface IDefensePos {
  defense_pos: number
}

class DefensePos implements Field {
  readonly uiId = 'DEFENSE_POS'
  readonly colName = 'defense_pos'
  readonly colType = 'integer' 

  private _val: number | null = null 

  set val(newVal: number) {
    if (isNaN(newVal) || newVal < 1 || newVal > 6) 
      throw new Error("DefensePos val should be a number from 1 through 6")

    this._val = newVal
  }

  get val() {
    if (this._val === null) throw new Error("DefensePos val has not been set") 
    
    return this._val
  }

  public serialize(): [x: string, y: number] {
    if (this._val === null) throw new Error("You must set the value of DefensePos before serializing")
    return [this.colName, this._val]
  }

}

export {DefensePos}
export type {IDefensePos}