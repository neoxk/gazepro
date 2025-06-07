
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import trainChannel from './trainChannel'
import { callback } from 'chart.js/dist/helpers/helpers.core'


const playerAPI = {
  onPlay: (cb: (path: string, from: number, to: number, speed:number) => void) => 
    ipcRenderer.on(trainChannel.PLAY , (_evt,path, from, to, speed)=>cb(path, from, to, speed)),
  onPause: (callback) => ipcRenderer.on(trainChannel.PAUSE, (_evt) => callback()) ,
  onResume: (cb) => ipcRenderer.on(trainChannel.RESUME, (_evt) => cb()),
  onDelay: (cb: (seconds: number) => void) => ipcRenderer.on(trainChannel.DELAY, (_evt, seconds) => cb(seconds)),

  isFullscreen: () => ipcRenderer.invoke(trainChannel.IS_FULLSCREEN),

  notifyLoaded: () => ipcRenderer.send(trainChannel.SCREEN_LOADED),
  notifyFinished: () => ipcRenderer.send(trainChannel.CLIP_FINISHED),
}


if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('playerAPI', playerAPI)
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore

  // @ts-ignore
  window.playerAPI = playerAPI
}