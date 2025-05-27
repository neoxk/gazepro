import { app } from 'electron'
import path from 'path'
import Const from './const'
import fs from 'fs'
import Settings from './settings/Settings'
import JSONSettingsManager from './settings/JSONSettingsManager'
import Timestamper from './timestamp/Timestamper'
import SQLiteTimerstamper from './timestamp/SQLiteTimerstamper'

export default class Initializer {
  private settingsController: Settings
  private timestampService: Timestamper

  constructor() {
    this.settingsController = new JSONSettingsManager()
    this.timestampService = new SQLiteTimerstamper()
  }

  public isFirstRun(): boolean {
    return !fs.existsSync(path.join(app.getPath('appData'), Const.APP_NAME))
  }

  public initNew(app_folder: string) {
    if (!fs.existsSync(app_folder)) {
      fs.mkdirSync(app_folder)
    }
  }
}
