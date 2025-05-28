import fs from 'fs'
import SettingsController from './SettingsController'

class JSONSettingsController implements SettingsController {

  private settings: { [id: string]: string } = {
  }

  private SETTINGS_PATH = ""


  init(settings_path: string, default_settings: { [id: string]: string }) {
    this.settings = default_settings
    this.SETTINGS_PATH = settings_path + '/settings.json'

    let settings_raw

    if (!fs.existsSync(this.SETTINGS_PATH)) {
      fs.writeFileSync(this.SETTINGS_PATH, JSON.stringify(this.settings), 'utf-8')
    } else {
        try {
          settings_raw = fs.readFileSync(this.SETTINGS_PATH, 'utf-8')
        } catch (err: any) {}

        try {
          this.settings = JSON.parse(settings_raw)
        } catch (err) {}
    }
  }

  private flush(): void {
    try {
      fs.writeFileSync(this.SETTINGS_PATH, JSON.stringify(this.settings), 'utf-8')
    } catch (err) {}
  }

  public get(id: string) {
    if (this.settings[id] === undefined) throw new Error(id + " is not set in settings")
    return this.settings[id]
  }

  public set(id: string, val: string) {
    this.settings[id] = val
    this.flush()
  }
}

export default new JSONSettingsController()
