import knex, { Knex } from 'knex'
import DBService from '../src/renderer/src/core/DBService'

describe('DBService.update', () => {
  let db: Knex

  beforeAll(() => {
    db = knex({ client: 'sqlite3', connection: { filename: ':memory:' }, useNullAsDefault: true })
    // @ts-ignore override private _knex
    DBService['_knex'] = db
  })

  beforeEach(async () => {
    await db.schema.dropTableIfExists('test')
    await db.schema.createTable('test', (t) => {
      t.increments('id').primary()
      t.integer('foo')
      t.text('bar')
    })
    await db('test').insert({ foo: 1, bar: 'baz' })
  })

  afterAll(async () => {
    await db.destroy()
  })

  it('throws if id is missing or not a number', async () => {
    await expect(DBService.update('test', { foo: 2 }))
      .rejects.toThrow('DBService.update: `id` is required')
    await expect(DBService.update('test', { id: 'not-a-number' } as any))
      .rejects.toThrow('DBService.update: `id` is required')
  })

  it('updates only the given row', async () => {
    const [newId] = await db('test').insert({ foo: 3, bar: 'qux' })
    await DBService.update('test', { id: newId, foo: 42, bar: 'updated' })

    const rows = await db('test').orderBy('id')
    expect(rows).toEqual([
      { id: 1, foo: 1, bar: 'baz' },
      { id: newId, foo: 42, bar: 'updated' }
    ])
  })
})
