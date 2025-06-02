import { DefensePos, IDefensePos } from '../fields/DefensePos'
import { GoalPos, IGoalPos } from '../fields/GoalPos'
import SportController from '../SportController'
import TSService from '../TSService'
import { Field } from '../fields/Field'

interface HandballTS extends IDefensePos, IGoalPos {
  id: number
  idVideo: number
  refPoint: number
  from: number
  to: number
  [key: string]: unknown
}

class HandballController implements SportController {
  private fields: Field[] = []
  private tableName: string = Sport.HANDBALL
  private loadedId: number | null = null

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

    if (!this.loadedId) {
      const row = await this.tsService.insert(entry)
    } else {
      await this.tsService.update(this.loadedId, entry as HandballTS)
    }

    this.resetFields()

    return true
  }

  public async getTimestampsOf(video_id: string): Promise<HandballTS[]> {
    return await this.tsService.query({
      idVideo: video_id
    })
  }

  public async getAllTimestamps(): Promise<HandballTS[]> {
    return await this.tsService.query({})
  }

  public async loadField(id: number): Promise<boolean> {
    this.loadedId = id
    const ts = await this.tsService.query({ id: id })

    this.resetFields()
    this.fields.forEach((field) => {
      field.val = ts[field.colName]
    })

    return true
  }
}

export default HandballController
