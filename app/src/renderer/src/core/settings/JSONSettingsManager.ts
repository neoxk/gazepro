import { app } from 'electron'
import path from 'path'
import Const from '../const'
import fs from 'fs'

export default class JSONSettingsManager implements Settings {
  private settings: { [id: string]: string } = {}
  private SETTINGS_PATH: string

  constructor(
    settings_path: string = path.join(app.getPath('appData'), Const.APP_NAME, 'settings.json')
  ) {
    this.SETTINGS_PATH = settings_path

    let settings_raw

    if (!fs.existsSync(this.SETTINGS_PATH)) {
      fs.writeFileSync(this.SETTINGS_PATH, JSON.stringify({}), 'utf-8')
    }

    try {
      settings_raw = fs.readFileSync(this.SETTINGS_PATH, 'utf-8')
    } catch (err: any) {}

    try {
      this.settings = JSON.parse(settings_raw)
    } catch (err) {}
  }

  private flush(): void {
    try {
      fs.writeFileSync(this.SETTINGS_PATH, JSON.stringify(this.settings), 'utf-8')
    } catch (err) {}
  }

  public get(id: string) {
    return this.settings[id]
  }

  public set(id: string, val: string) {
    this.settings[id] = val
    this.flush()
  }
}
