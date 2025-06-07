import TSService from "./TSService"

export interface CutoutRow {
  id:             number
  video_path:     string
  start:          number
  end:            number
  label:          string
  zone:           number
  shotHand:       string
  defended:       string
  position:       string
  thumbnail_path: string
}

class CutoutsController {
  private ts = new TSService<CutoutRow>()

  async save(
    cutout: Omit<CutoutRow, "id">
  ) {
    const row = {
      video_path:     cutout.video_path,
      start:          cutout.start,
      end:            cutout.end,
      label:          cutout.label,
      zone:           cutout.zone,
      shotHand:       cutout.shotHand,
      defended:       cutout.defended,
      position:       cutout.position,
      thumbnail_path: cutout.thumbnail_path,
    }
    await this.ts.insert("cutouts", row)
  }

  async loadFor(
    videoPath: string
  ): Promise<CutoutRow[]> {
    const rows: CutoutRow[] = await this.ts.query("cutouts", {
      video_path: videoPath,
    })
    return rows.map((r) => ({
      id:             r.id,
      video_path:     r.video_path,
      start:          r.start,
      end:            r.end,
      label:          r.label,
      zone:           r.zone,
      shotHand:       r.shotHand,
      defended:       r.defended,
      position:       r.position,
      thumbnail_path: r.thumbnail_path,
    }))
  }

  async loadAll(): Promise<CutoutRow[]> {
    return this.ts.query("cutouts", {})
  }

  async deleteById(id: number): Promise<void> {
    await this.ts.delete("cutouts", { id })
  }

  public async update(
    id: number,
    fields: Partial<Omit<CutoutRow, 'id'>>
  ): Promise<void> {
    if (typeof id !== 'number' || Number.isNaN(id)) {
      throw new Error('CutoutsController.update: `id` must be a number')
    }
    await this.ts.update('cutouts', { id, ...fields } as Record<string, unknown>)
  }

}

export default new CutoutsController()
