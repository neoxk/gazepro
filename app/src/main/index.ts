import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Initializer from '../renderer/src/core/Initializer'
import videoController from '../renderer/src/core/video/VideoController'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 1000,
    minWidth: 1280,
    minHeight: 720,
    resizable: true,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const initializer = new Initializer()

app.whenReady().then(() => {
  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select a folder',
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return []

    const folderPath = result.filePaths[0]
    return folderPath
  })

  ipcMain.handle('app:isFirstRun', () => initializer.isFirstRun())

  ipcMain.handle('app:initNew', (_e, appFolder: string, sport: Sport) => {
    initializer.initNew(appFolder, sport)
  })

  ipcMain.handle('app:init', (_e, sport: Sport) => {
    initializer.init(sport)
  })

  /* ------------------------------------------------------------------ *
   *  SETTINGS                                                          *
   * ------------------------------------------------------------------ */
  ipcMain.handle('settings:get', (_e, key: string) => {
    return initializer.getSettingsController().get(key)
  })

  ipcMain.handle('settings:set', (_e, key: string, value: string) => {
    initializer.getSettingsController().set(key, value)
  })

  /* ------------------------------------------------------------------ *
   *  VIDEO                                                             *
   * ------------------------------------------------------------------ */
  ipcMain.handle('video:import', async (_e, name: string, srcPath: string, hz: number) => {
    return await videoController.import(name, srcPath, hz)
  })

  ipcMain.handle('video:list', () => videoController.getVideos())

  /* ------------------------------------------------------------------ *
   *  SPORT-SPECIFIC (current sport comes from Initializer)             *
   * ------------------------------------------------------------------ */
  ipcMain.handle('sport:getFields', () => {
    const fields = initializer.getSportController().getFields()
    // strip methods before shipping to renderer
    return fields.map((f) => ({ colName: f.colName, val: f.val }))
  })

  ipcMain.handle('sport:resetFields', () => initializer.getSportController().resetFields())

  ipcMain.handle('sport:flushFields', () => initializer.getSportController().flushFields())

  ipcMain.handle('sport:getTimestampsOf', (_e, videoId: string) =>
    initializer.getSportController().getTimestampsOf(videoId)
  )

  ipcMain.handle('sport:getAllTimestamps', () =>
    initializer.getSportController().getAllTimestamps()
  )

  ipcMain.handle('sport:loadField', (_e, id: number) =>
    initializer.getSportController().loadField(id)
  )

  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
