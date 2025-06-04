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

  }


  public async insert(
    tableName: string,
    entry: Record<string, unknown>
  ): Promise<any> {
    if (!this._knex) throw new Error("init() must be called first.");

    return this._knex(tableName).insert(entry);
  }

  public async query(tableName: string, filter: Record<string, unknown>) {
    if (!this._knex) throw new Error("init() must be called first.");
    return this._knex(tableName).where(filter);
  }

  public async delete(
    tableName: string,
    filter: Record<string, unknown>
  ): Promise<number[]> {
    return (this._knex!(tableName).where(filter).del() as unknown) as number[];
}

  public async update(
    tableName: string,
    entry: Record<string, unknown>
  ): Promise<void> {
    if (!this._knex) throw new Error("init() must be called first.");

    const id = entry["id"];
    if (typeof id !== "number") {
      throw new Error("DBService.update: `id` is required and must be a number");
    }

    delete entry["id"];
    await this._knex(tableName).where({ id }).update(entry);
  }


}

export default new DBService();

