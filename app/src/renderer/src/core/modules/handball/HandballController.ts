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
    this.tsService = new TSService()
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

  public resetFields(): void {
    this.initFields()
  }

  public async flushFields(): Promise<HandballTS> {
    const entry = {}

    this.fields.forEach(field => entry[field.colName] = field.val)

    const row = await this.tsService.insert(this.tableName, entry)

    this.resetFields()

    return row
  } 
}

export default HandballController