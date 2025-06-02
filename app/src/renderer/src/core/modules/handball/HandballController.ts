import { DefensePos, IDefensePos } from '../fields/DefensePos'
import { GoalPos, IGoalPos } from '../fields/GoalPos'
import SportController from '../SportController'
import TSService from '../TSService'

interface HandballTS extends IDefensePos, IGoalPos {
  id: number
  idVideo: number
  refPoint: number
  from: number
  to: number
}

class HandballController implements SportController {
  private fields: Field[] = []
  private tableName = 'handball'

  private tsService: TSService<HandballTS>

  constructor() {
    this.initFields()
    this.tsService = new TSService(this.tableName, this.fields)
    this.tsService.initTable()
  }

  private initFields() {
    this.fields = [new DefensePos(), new GoalPos()]
  }

  public getFields() {
    return this.fields
  }

  public resetFields(): void {
    this.initFields()
  }

  public async flushFields(): Promise<boolean> {
    const entry = {}

    this.fields.forEach((field) => (entry[field.colName] = field.val))

    const row = await this.tsService.insert(entry)

    this.resetFields()

    return true
  }
}

export default HandballController
