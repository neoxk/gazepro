import TSService from '../src/renderer/src/core/modules/TSService'
import DBService from '../src/renderer/src/core/DBService'

jest.mock('../src/renderer/src/core/DBService')

describe('TSService', () => {
  const fakeTable = 'mytable'
  const svc = new TSService<{ id: number; x: number }>()
  svc['conn'] = (DBService as unknown) as any
  beforeEach(jest.clearAllMocks)

  it('update() calls DBService.update with right args', async () => {
    await svc.update(fakeTable, { id: 5, x: 99 })
    expect(DBService.update).toHaveBeenCalledWith(fakeTable, { id: 5, x: 99 })
  })
})