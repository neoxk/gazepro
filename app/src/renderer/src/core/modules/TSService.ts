import dbService from '../DBService'

class TSService<T extends Record<string, unknown>> {
  private conn: typeof dbService
  private fields: Field[]
  private tableName: string

  constructor(tableName: string, fields: Field[]) {
    this.fields = fields
    this.conn = dbService
    this.tableName = tableName
  }

  public async initTable() {
    this.fields.forEach((field) => {})
  }

  public insert(entry: Record<string, unknown>): Promise<T> {
    return new Promise((resolve) => {
      this.conn.insert(this.tableName, entry).then((res) => resolve(res))
    })
  }

  public async update(id: number, entry: T): Promise<void> {
    return await this.conn.update(this.tableName, entry)
  }

  public query(filter: Record<string, unknown>): Promise<T[]> {
    return this.conn.query(this.tableName, filter)
  }

  public delete(filter: Record<string, unknown>): Promise<number> {
    return this.conn.delete(this.tableName, filter).then((result: number[]) => result[0])
  }
}

export default TSService
