import knex, { Knex } from "knex";

class DBService {
  private _knex: Knex | null = null;

  init(path: string) {
    this._knex = knex({
      client: "sqlite3",
      connection: { filename: path },
      useNullAsDefault: true,
      debug: true,
    });
  }


  public async initTable(
    tableName: string,
    cols: { colName: string; type: string }[]
  ): Promise<void> {
    if (!this._knex) throw new Error("init() must be called first.");

    const exists = await this._knex.schema.hasTable(tableName);
    if (!exists) {
      await this._knex.schema.createTable(tableName, (table) => {
        for (const { colName, type } of cols) {
          table.specificType(colName, type);
        }
      });
    }

    //TODO if the fields change and the database already exists there needs to be some way of migrating the old structure and rows to the new one
  }


  public async insert(
    tableName: string,
    entry: Record<string, unknown>
  ): Promise<any> {
    if (!this._knex) throw new Error("init() must be called first.");

    return this._knex(tableName).insert(entry);
  }
}

export default new DBService();

