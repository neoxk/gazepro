import {DefensePos, IDefensePos} from "../fields/DefensePos"
import {GoalPos, IGoalPos} from "../fields/GoalPos"
import TSService from "../TSService"

interface HandballTS extends IDefensePos, IGoalPos {
  id: number,
  idVideo: number,
  refPoint: number,
  from: number,
  to: number,
}

class HandballController {
  private fields: Field[] = []
  private tableName = 'handball'

  private tsService: TSService<HandballTS> 

  constructor() {
    this.tsService = new TSService<HandballTS>()
    this.initFields()
    this.tsService.initTable()
  } 

  private initFields() {
    this.fields = [
      new DefensePos(),
      new GoalPos(),
    ]
  }


  public getFields() {
    return this.fields
  }

  public flushFields(): Promise<boolean> {
    const entry = {}
    this.fields.forEach(field => entry[field.colName] = field.val)
    entry['tableName'] = this.tableName 
    this.tsService.insert(entry)

  } 
}

export default HandballController