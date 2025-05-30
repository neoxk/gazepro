import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  openVideo: () => ipcRenderer.invoke('dialog:openVideo'),
  saveCutout: (c: any) => ipcRenderer.invoke('cutouts:save', c),
  loadCutouts: (videoPath: string) =>
    ipcRenderer.invoke('cutouts:load', videoPath),
  loadAllCutouts: () => ipcRenderer.invoke('cutouts:loadAll'),
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
