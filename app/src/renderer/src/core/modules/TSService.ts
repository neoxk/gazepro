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
    
  }

  export default TSService