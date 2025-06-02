import { app } from 'electron'
import path from 'path'
import Const from './const'
import fs from 'fs'
import SettingsController from './settings/SettingsController'
import JSONSettingsController from './settings/JSONSettingsController'
import DBService from './DBService'
import videoController from './video/VideoController'
import SportController from './modules/SportController'
import HandballController from './modules/handball/HandballController'

export default class Initializer {
  private settingsController: SettingsController
  private sportController: SportController | null = null

  constructor() {
    this.settingsController = JSONSettingsController

    this.settingsController.init(Const.SETTINGS_PATH, {
      databasePath: path.join(app.getPath('appData'), Const.APP_NAME, 'data.sql'),
      rootVideoPath: path.join(app.getPath('appData'), Const.APP_NAME)
    })

    DBService.init(this.settingsController.get('databasePath'))
  }

  public isFirstRun(): boolean {
    return !fs.existsSync(path.join(app.getPath('appData'), Const.APP_NAME))
  }

  public initNew(app_folder: string, sport: Sport) {
    if (!fs.existsSync(app_folder)) {
      fs.mkdirSync(app_folder)
    }

    this.init(sport)
  }

  public init(sport: Sport) {
    switch (sport) {
      case Sport.HANDBALL:
        this.sportController = new HandballController()
        videoController.init(Sport.HANDBALL)
    }
  }

  public getSettingsController() {
    return this.settingsController
  }

  public getSportController() {
    if (!this.sportController) throw new Error('Sport has not yet been selected with init(sport)')
    return this.sportController
  }
}
