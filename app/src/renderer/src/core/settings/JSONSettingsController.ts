import fs from 'fs'
import SettingsController from './SettingsController'

export default class JSONSettingsController implements SettingsController {
  private settings: { [id: string]: string } = {}
  private SETTINGS_PATH: string

  constructor(settings_path) {
    this.SETTINGS_PATH = settings_path + '/settings.json'

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
