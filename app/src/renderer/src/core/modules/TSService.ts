import dbService from "../DBService"

class TSService<T> {
  private conn: typeof dbService

  constructor() {
    this.conn = dbService 
  }

  public async initTable() {
    
  }

  public insert(tableName: string, entry: Record<string, unknown>): Promise<T> {
    return new Promise(resolve => {
        this.conn.insert(tableName, entry)
        .then(res => resolve(res))
      })
    }

    public query(tableName: string, filter: Record<string, unknown>): Promise<T[]> {
      return this.conn.query(tableName, filter);
    }

  public delete(tableName: string, filter: Record<string, unknown>): Promise<number> {
    return this.conn.delete(tableName, filter).then((result: number[]) => result[0]);
  }

  public update(tableName: string, entry: Record<string, unknown>): Promise<void> {
    return this.conn.update(tableName, entry);
  }
}
    
export default TSService