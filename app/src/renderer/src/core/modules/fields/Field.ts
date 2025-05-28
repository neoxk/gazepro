interface Field {
  readonly colName: string;
  readonly colType: string;
  readonly uiId: string;

  val: number;

  serialize(): [colName: string, val: number];
}
