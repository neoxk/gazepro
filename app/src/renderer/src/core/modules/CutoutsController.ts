import TSService from './TSService';

export interface CutoutRow {
  video_path: string;
  start: number;
  end: number;
  label: string;
  zone: number;
  categories: string;
}

class CutoutsController {
  private ts = new TSService<CutoutRow>();

  async save(cutout: Omit<CutoutRow, 'categories'> & { categories: string[] }) {
    const row = {
      ...cutout,
      categories: JSON.stringify(cutout.categories),
    };
    await this.ts.insert('cutouts', row);
    return;
  }

  async loadFor(videoPath: string): Promise<(Omit<CutoutRow, 'categories'> & { categories: string[] })[]> {
    const rows: CutoutRow[] = await this.ts.query('cutouts', { video_path: videoPath });
    return rows.map(r => ({
      video_path: r.video_path,
      start: r.start,
      end: r.end,
      label: r.label,
      zone: r.zone,
      categories: JSON.parse(r.categories),
    }));
  }

  async loadAll(): Promise<CutoutRow[]> {
    return this.ts.query('cutouts', {})
  }
}

export default new CutoutsController();
