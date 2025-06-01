import TSService from "./TSService"

export interface CutoutRow {
  id:             number
  video_path:     string
  start:          number
  end:            number
  label:          string
  zone:           number
  categories:     string
  thumbnail_path: string
}

class CutoutsController {
  private ts = new TSService<CutoutRow>()

  async save(
    cutout: Omit<CutoutRow, "id" | "categories" | "thumbnail_path"> & {
      categories: string[]
      thumbnail_path: string
    }
  ) {
    const row = {
      video_path:     cutout.video_path,
      start:          cutout.start,
      end:            cutout.end,
      label:          cutout.label,
      zone:           cutout.zone,
      categories:     JSON.stringify(cutout.categories),
      thumbnail_path: cutout.thumbnail_path,
    }
    await this.ts.insert("cutouts", row)
  }

  async loadFor(
    videoPath: string
  ): Promise<Array<Omit<CutoutRow, "categories"> & { categories: string[] }>> {
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
      categories:     JSON.parse(r.categories),
      thumbnail_path: r.thumbnail_path,
    }))
  }

  async loadAll(): Promise<CutoutRow[]> {
    return this.ts.query("cutouts", {})
  }

  async deleteById(id: number): Promise<void> {
    await this.ts.delete("cutouts", { id })
  }
}

export default new CutoutsController()
