import CutoutsController, { CutoutRow } from '../src/renderer/src/core/modules/CutoutsController'
import TSService from '../src/renderer/src/core/modules/TSService'

jest.mock('../src/renderer/src/core/modules/TSService')

describe('CutoutsController.update (Approach B)', () => {
  const fakeRow: CutoutRow = {
    id:             7,
    video_path:     '/videos/foo.mp4',
    start:          1,
    end:            2,
    label:          'Test Snippet',
    zone:           3,
    shotHand:       'left',
    defended:       'no',
    position:       'Center',
    thumbnail_path: '/thumbs/foo.jpg'
  }

  let mockTs: jest.Mocked<TSService<CutoutRow>>

  beforeEach(() => {
    // @ts-ignore
    mockTs = (CutoutsController as any).ts as jest.Mocked<TSService<CutoutRow>>
    jest.clearAllMocks()
  })

  it('throws if id is not a number', async () => {
    await expect(
      CutoutsController.update(NaN, { label: 'anything' })
    ).rejects.toThrow('CutoutsController.update: `id` must be a number')
  })

  it('delegates to TSService.update with merged id+fields when id is valid', async () => {
    mockTs.update.mockResolvedValueOnce(undefined)

    const fieldsToUpdate = { label: 'Updated Label', zone: 5 }

    await expect(
      CutoutsController.update(fakeRow.id, fieldsToUpdate)
    ).resolves.toBeUndefined()

    expect(mockTs.update).toHaveBeenCalledWith(
      'cutouts',
      { id: fakeRow.id, ...fieldsToUpdate }
    )
  })
})