import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import Initializer from '../renderer/src/core/Initializer'
import Const from '../renderer/src/core/const'

import CutoutsController, { CutoutRow } from '../renderer/src/core/modules/CutoutsController'

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

  ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select a folder',
    properties: ['openDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) return []

  const folderPath = result.filePaths[0]
  const entries = await fs.promises.readdir(folderPath)
  const videoExts = ['.mp4', '.mov', '.mkv', '.avi']
  const videos = entries
    .filter((fname) => videoExts.includes(path.extname(fname).toLowerCase()))
    .map((fname) => path.join(folderPath, fname))
  return videos
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

  ipcMain.handle("cutouts:delete", async (_evt, id: number) => {
  const rows: CutoutRow[] = await CutoutsController.loadAll()
  const toDelete = rows.find((r) => r.id === id)
  if (toDelete && toDelete.thumbnail_path) {
    const thumbPath = toDelete.thumbnail_path
    if (fs.existsSync(thumbPath)) {
      try {
        fs.unlinkSync(thumbPath)
      } catch (err) {
        console.warn("Failed to delete thumbnail file:", thumbPath, err)
      }
    }
  }

  await CutoutsController.deleteById(id)
  return true
})

  ipcMain.handle(
  "cutouts:saveWithThumbnail",
  async (_evt, payload: {
    video_path: string
    start: number
    end: number
    label: string
    zone: number
    categories: string[]
    thumbnailDataUrl: string
  }) => {
    const {
      video_path,
      start,
      end,
      label,
      zone,
      categories,
      thumbnailDataUrl,
    } = payload

    const basefolder = path.join(app.getPath("appData"), "gazepro", "thumbnails")
    if (!fs.existsSync(basefolder)) fs.mkdirSync(basefolder, { recursive: true })

    const filename = `thumb_${Date.now()}.jpg`
    const outPath = path.join(basefolder, filename)

    const data = thumbnailDataUrl.replace(/^data:image\/\w+;base64,/, "")
    const buffer = Buffer.from(data, "base64")
    fs.writeFileSync(outPath, buffer)

    await CutoutsController.save({
      video_path,
      start,
      end,
      label,
      zone,
      categories,
      thumbnail_path: outPath,
    })

    return true
  }
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
