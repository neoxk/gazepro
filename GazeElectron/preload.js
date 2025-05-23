const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  saveCuts: (videoPath, cuts) => ipcRenderer.invoke('save-cuts', { videoPath, cuts })
})
