const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')
const fs   = require('fs')

let mainWin

function createWindow() {
  mainWin = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  mainWin.loadFile(path.join(__dirname, 'renderer/index.html'))
}

app.whenReady().then(createWindow)

ipcMain.handle('select-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  if (canceled) return { canceled: true }

  const folder = filePaths[0]
  const files  = fs.readdirSync(folder)
  const videos = files
    .filter(f => /\.(mp4|mov|avi)$/i.test(f))
    .map(f => {
      const base      = path.parse(f).name
      const videoPath = path.join(folder, f)
      const txtPath   = path.join(folder, `${base}.txt`)
      let cuts = []

      if (fs.existsSync(txtPath)) {
        const lines = fs.readFileSync(txtPath, 'utf8')
          .split(/\r?\n/).filter(Boolean)
        cuts = lines.map(line => {
          const [s, e, cat] = line.split(',')
          return {
            start:    parseFloat(s),
            end:      parseFloat(e),
            category: parseInt(cat, 10)
          }
        })
      }

      return { name: base, videoPath, cuts }
    })

  return { canceled: false, videos }
})

ipcMain.handle('save-cuts', async (_evt, { videoPath, cuts }) => {
  const folder = path.dirname(videoPath)
  const base   = path.parse(videoPath).name
  const txt    = path.join(folder, `${base}.txt`)
  const lines  = cuts.map(c =>
    [c.start.toFixed(3), c.end.toFixed(3), c.category].join(',')
  )
  fs.writeFileSync(txt, lines.join('\n'))
  return { success: true }
})
