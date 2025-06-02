import DBService from '../DBService'
import fs from 'fs'
import JSONSettingsController from '../settings/JSONSettingsController'
import path from 'path'

class VideoController {
  private conn: typeof DBService = DBService
  private TABLE_NAME = 'videos'
  private sport: Sport | null = null

  constructor() {}

  public init(sport: Sport) {
    this.sport = sport
    this.conn.initTable(this.TABLE_NAME, {
      name: 'text',
      path: 'text',
      refresh_rate: 'number',
      sport: 'text'
    })
  }

  public async import(name: string, external_path: string, hz: number): Promise<number> {
    if (!this.sport) throw new Error('You must first call init()')

    let internal_path: string = ''

    try {
      internal_path = path.join(JSONSettingsController.get('rootVideoPath'), this.sport, name)
      fs.copyFileSync(external_path, internal_path)
    } catch (err) {
      throw new Error('Failed to copy video to ' + internal_path)
    }

    try {
      return await this.conn
        .insert(this.TABLE_NAME, {
          name: name,
          path: path.join(path.basename(internal_path)),
          refresh_rate: hz,
          sport: this.sport
        })
        .then((entry) => entry.id)
    } catch (err) {
      throw new Error('Failed to import video -- ' + err)
    }
  }

  public async getVideos() {
    if (!this.sport) throw new Error('You must first call init()')
    return this.conn.query(this.TABLE_NAME, {
      sport: this.sport
    })
  }
}

export default new VideoController()
