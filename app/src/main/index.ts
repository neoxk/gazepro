import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import Initializer from '../renderer/src/core/Initializer'
import Const from '../renderer/src/core/const'

import CutoutsController from '../renderer/src/core/modules/CutoutsController'

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
      sandbox: false
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

app.whenReady().then(() => {
  const initializer = new Initializer()
  initializer.initNew(Const.SETTINGS_PATH)

  ipcMain.handle('dialog:openVideo', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select a video file',
      properties: ['openFile'],
      filters: [{ name: 'Videos', extensions: ['mp4','mov','mkv','avi'] }]
    })
    return canceled || filePaths.length === 0 ? null : filePaths[0]
  })

  ipcMain.handle('cutouts:save', async (_evt, cutout) => {
    await CutoutsController.save(cutout)
    return true
  })

  ipcMain.handle('cutouts:load', async (_evt, videoPath: string) => {
    return await CutoutsController.loadFor(videoPath)
  })

  ipcMain.handle('cutouts:loadAll', async () => {
    return await CutoutsController.loadAll()
  })

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
