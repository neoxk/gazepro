import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  openFolder: (): Promise<string[]> => ipcRenderer.invoke('dialog:openFolder'),
  saveCutout: (c: any) => ipcRenderer.invoke('cutouts:save', c),
  loadCutouts: (videoPath: string) =>
    ipcRenderer.invoke('cutouts:load', videoPath),
  loadAllCutouts: () => ipcRenderer.invoke('cutouts:loadAll'),
  deleteCutout: (id: number) => ipcRenderer.invoke("cutouts:delete", id),
  saveCutoutWithThumbnail: (payload: {
    video_path: string
    start: number
    end: number
    label: string
    zone: number
    categories: string[]
    thumbnailDataUrl: string
  }) => ipcRenderer.invoke("cutouts:saveWithThumbnail", payload),
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
