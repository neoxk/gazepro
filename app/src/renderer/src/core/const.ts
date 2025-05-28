import { app } from 'electron'
import path from 'path'

export default class Const {
  public static APP_NAME = 'gazepro'
  public static SETTINGS_PATH = path.join(app.getPath('appData'), this.APP_NAME)
}
