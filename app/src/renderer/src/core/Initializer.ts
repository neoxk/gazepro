import { app } from 'electron'
import path from 'path'
import Const from './const'
import fs from 'fs'
import SettingsController from './settings/SettingsController'
import JSONSettingsController from './settings/JSONSettingsController'

export default class Initializer {
  private settingsController: SettingsController

  constructor() {
    this.settingsController = new JSONSettingsController(Const.SETTINGS_PATH)
  }

  public isFirstRun(): boolean {
    return !fs.existsSync(path.join(app.getPath('appData'), Const.APP_NAME))
  }

  public initNew(app_folder: string) {
    if (!fs.existsSync(app_folder)) {
      fs.mkdirSync(app_folder)
    }
  }

  public getSettingsController() {
    return this.settingsController
  }
}
