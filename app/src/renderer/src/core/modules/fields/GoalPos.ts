interface IGoalPos {
  goal_pos: number
}

class GoalPos implements Field{
  readonly uiId = 'GOAL_POS'
  readonly colName = 'goal_pos'
  readonly colType = 'integer' 

  private _val: number | null = null 

  set val(newVal: number) {
    if (isNaN(newVal) || newVal < 1 || newVal > 9) 
      throw new Error("GoalPos val should be a number from 1 through 9")

    this._val = newVal
  }

  get val() {
    if (this._val === null) throw new Error("You must set the value of GoalPos before reading") 
    
    return this._val
  }

  public serialize(): [colName: string, val: number] {
    if (this._val === null) throw new Error("You must set the value of GoalPos before serializing")
    return [this.colName, this._val]
  }

}

export {GoalPos}
export type {IGoalPos}
