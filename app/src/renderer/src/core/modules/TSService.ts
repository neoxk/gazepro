import { Database } from "sqlite3"
import dbService from "../DBService"

class TSService<T> {
  private conn: typeof dbService

  constructor() {
    this.conn = dbService 
  }

  public async initTable() {

  }

  public insert(entry: {tableName: string, [key: string]: unknown}): Promise<boolean> {
    return new Promise((resolve) => resolve(true))
  } 
   
}

export default TSService