import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import trainChannel from './trainChannel'

const trainAPI = {
  loadScreen: () => ipcRenderer.send(trainChannel.LOAD_SCREEN),
  play: (vid_path: string, from: number, to: number, speed: number) => ipcRenderer.send(trainChannel.PLAY, vid_path, from, to, speed),
  pause: () => ipcRenderer.send(trainChannel.PAUSE),
  exit: () => ipcRenderer.send(trainChannel.EXIT),
  delay: (seconds: number) => ipcRenderer.send(trainChannel.DELAY),

  onScreenLoaded: (cb) => ipcRenderer.on(trainChannel.SCREEN_LOADED, (_evt) => cb()),
  onClipFinished: (cb) => ipcRenderer.on(trainChannel.CLIP_FINISHED, (_evt) => cb())
}

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
    shotHand: string
    defended: string
    position: string
    thumbnailDataUrl: string
  }) => ipcRenderer.invoke("cutouts:saveWithThumbnail", payload),
  updateCutout: (id: number, fields: any) =>
    ipcRenderer.invoke('cutout:update', id, fields) as Promise<{ success: boolean }>,
  getFrameRate: (filePath: string) =>
    ipcRenderer.invoke('video:getFrameRate', filePath) as Promise<{ fps: number }>,
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('api', api)
  contextBridge.exposeInMainWorld('trainAPI', trainAPI)
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
