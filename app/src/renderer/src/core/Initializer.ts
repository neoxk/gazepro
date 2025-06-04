import { app } from 'electron'
import path from 'path'
import Const from './const'
import fs from 'fs'
import SettingsController from './settings/SettingsController'
import JSONSettingsController from './settings/JSONSettingsController'
import DBService from './DBService'

export default class Initializer {
  private settingsController: SettingsController

  constructor() {
    this.settingsController = JSONSettingsController

    this.settingsController.init(
      Const.SETTINGS_PATH, 
      {
        databasePath: path.join(app.getPath('appData'), Const.APP_NAME, 'data.sql')
      }
    )

    DBService.init(this.settingsController.get('databasePath'))

    DBService.initTable('cutouts', [
      { colName: 'id',         type: 'integer PRIMARY KEY AUTOINCREMENT' },
      { colName: 'video_path', type: 'text' },
      { colName: 'start',      type: 'real' },
      { colName: 'end',        type: 'real' },
      { colName: 'label',      type: 'text' },
      { colName: 'zone',       type: 'integer' },
      { colName: 'shotHand',   type: 'text' },
      { colName: 'defended',   type: 'text' },
      { colName: 'position',   type: 'text' },
      { colName: 'thumbnail_path', type: 'text' },
    ]);

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
