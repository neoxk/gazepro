import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import ffmpeg from 'fluent-ffmpeg'
import ffprobeStatic from '@ffprobe-installer/ffprobe'
import icon from '../../resources/icon.png?asset'

import Initializer from '../renderer/src/core/Initializer'
import Const from '../renderer/src/core/const'

import CutoutsController, { CutoutRow } from '../renderer/src/core/modules/CutoutsController'

import trainChannel from '../preload/trainChannel'

ffmpeg.setFfprobePath(ffprobeStatic.path)

const iconPath = path.join(__dirname, '../../resources/icons/png/64x64.png')

let mainWindow: BrowserWindow
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 1000,
    minWidth: 1280,
    minHeight: 720,
    resizable: true,
    show: false,
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.setMenu(null)
  mainWindow.setMenuBarVisibility(false)

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

  let trainWin: BrowserWindow | null
  let fullscreen = true

  /* TRAIN SCREEN COMMUNICATION -- MAIN -> TRAIN
      -------------------------
  */

  ipcMain.on(trainChannel.LOAD_SCREEN, (_evt) => {
    const primaryDisplay = screen.getPrimaryDisplay()
    let extDisplay = screen.getAllDisplays().find((display) => display.id != primaryDisplay.id)

    if (!extDisplay) {
      extDisplay = primaryDisplay
      fullscreen = false
    }

    console.log('load screen ' + _evt.processId)
    trainWin = new BrowserWindow({
      x: extDisplay.bounds.x,
      y: extDisplay.bounds.y,
      width: 600,
      height: 450,
      frame: false,
      show: false,
      webPreferences: {
        preload: join(__dirname, '../preload/train.js'),
        sandbox: false
      }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL'])
      trainWin.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#/trainprojection')
    else
      trainWin.loadFile(path.join(__dirname, '../renderer/index.html'), {
        hash: '/trainprojection'
      })

    trainWin.on('ready-to-show', () => trainWin!.show())
  })

  ipcMain.handle(trainChannel.IS_FULLSCREEN, (_evt) => {
    _evt.processId
    console.log('Asked if fullscreen, returning: ' + fullscreen)
    return fullscreen
  })

  ipcMain.on(
    trainChannel.PLAY,
    (_evt, vid_path: string, from: number, to: number, speed: number) => {
      console.log('play ' + _evt.processId)
      if (!trainWin) throw new Error('Trying to play but trainWin hasnt been created yet')
      trainWin.webContents.send(trainChannel.PLAY, vid_path, from, to, speed)
    }
  )

  ipcMain.on(trainChannel.PAUSE, (_evt) => {
    console.log('pause ' + _evt.processId)
    if (!trainWin) throw new Error('Trying to pause but trainWin hasnt been created yet')
    trainWin.webContents.send(trainChannel.PAUSE)
  })

  ipcMain.on(trainChannel.RESUME, (_evt) => {
    console.log('resume ' + _evt.processId)
    if (!trainWin) throw new Error('Trying to resume but trainWin hasnt been created yet')
    trainWin.webContents.send(trainChannel.RESUME)
  })

  ipcMain.on(trainChannel.EXIT, (_evt) => {
    console.log('exit ' + _evt.processId)
    if (!trainWin) throw new Error('Trying to destroy but trainWin hasnt been created yet')
    trainWin.destroy()
    trainWin = null
  })

  ipcMain.on(trainChannel.DELAY, (_evt, seconds: number) => {
    console.log('delay ' + _evt.processId)
    if (!trainWin) throw new Error('Trying to delay but trainWin hasnt been created yet')
    trainWin.webContents.send(trainChannel.DELAY, seconds)
  })

  /* TRAIN SCREEN COMMUNICATION -- MAIN -> TRAIN
      -------------------------
  */

  // TRAIN -> MAIN (notificationst)

  ipcMain.on(trainChannel.CLIP_FINISHED, (_evt) => {
    console.log('clip finished ' + _evt.processId)
    mainWindow.webContents.send(trainChannel.CLIP_FINISHED)
  })
  ipcMain.on(trainChannel.SCREEN_LOADED, (_evt) => {
    console.log('Number of listeners for SCREEN_LOADED ')
    console.log('screen loaded ' + _evt.processId)
    mainWindow.webContents.send(trainChannel.SCREEN_LOADED)
  })

  // ------------------

  ipcMain.on('log', (_evt, msg) => {
    console.log(msg)
  })

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
    console.log('load cutouts')
    return await CutoutsController.loadFor(videoPath)
  })

  ipcMain.handle('cutouts:loadAll', async () => {
    return await CutoutsController.loadAll()
  })

  ipcMain.handle('cutouts:delete', async (_evt, id: number) => {
    const rows: CutoutRow[] = await CutoutsController.loadAll()
    const toDelete = rows.find((r) => r.id === id)
    if (toDelete && toDelete.thumbnail_path) {
      const thumbPath = toDelete.thumbnail_path
      if (fs.existsSync(thumbPath)) {
        try {
          fs.unlinkSync(thumbPath)
        } catch (err) {
          console.warn('Failed to delete thumbnail file:', thumbPath, err)
        }
      }
    }

    await CutoutsController.deleteById(id)
    return true
  })

  ipcMain.handle(
    'cutouts:saveWithThumbnail',
    async (
      _evt,
      payload: {
        video_path: string
        start: number
        end: number
        label: string
        zone: number
        shotHand: string
        defended: string
        position: string
        thumbnailDataUrl: string
      }
    ) => {
      const {
        video_path,
        start,
        end,
        label,
        zone,
        shotHand,
        defended,
        position,
        thumbnailDataUrl
      } = payload

      console.log('in main process saveWithThumbnail call')

      const basefolder = path.join(app.getPath('appData'), 'gazepro', 'thumbnails')
      if (!fs.existsSync(basefolder)) fs.mkdirSync(basefolder, { recursive: true })

      const filename = `thumb_${Date.now()}.jpg`
      const outPath = path.join(basefolder, filename)

      const data = thumbnailDataUrl.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(data, 'base64')
      fs.writeFileSync(outPath, buffer)

      console.log('written')

      await CutoutsController.save({
        video_path,
        start,
        end,
        label,
        zone,
        shotHand,
        defended,
        position,
        thumbnail_path: outPath
      })

      return true
    }
  )

  ipcMain.handle(
    'cutout:update',
    async (_e, id: number, fields: Partial<Omit<CutoutRow, 'id'>>) => {
      if (typeof id !== 'number') {
        throw new Error('cutout:update: id must be a number')
      }
      await CutoutsController.update(id, fields)
      return { success: true }
    }
  )

  ipcMain.handle('video:getFrameRate', async (_e, filePath: string) => {
    return new Promise<{ fps: number }>((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) return reject(new Error('ffprobe failed: ' + err.message))
        const videoStream = metadata.streams.find((s) => s.codec_type === 'video')
        if (!videoStream || !videoStream.r_frame_rate) {
          return reject(new Error('No video stream or frame rate info found'))
        }
        const parts = videoStream.r_frame_rate.split('/')
        let fps = 0
        if (parts.length === 2) {
          const num = parseFloat(parts[0])
          const den = parseFloat(parts[1])
          if (den !== 0) fps = num / den
        } else {
          fps = parseFloat(videoStream.r_frame_rate)
        }
        resolve({ fps })
      })
    })
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
