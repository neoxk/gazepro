import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Video } from '../renderer/src/core/video/VideoController'
import { Field } from '../renderer/src/core/modules/fields/Field'

export type { Video, Field }

/* ----------------------------- API surface ------------------------------ */
const api = {
  /* App / Init */
  isFirstRun: () => ipcRenderer.invoke('app:isFirstRun') as Promise<boolean>,
  initNew: (appFolder: string, sport: Sport) => ipcRenderer.invoke('app:initNew', appFolder, sport),
  init: (sport: Sport) => ipcRenderer.invoke('app:init', sport),

  /* Settings */
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key) as Promise<string>,
  setSetting: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),

  /* Dialog */
  openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder') as Promise<string>,

  /* Videos */
  importVideo: (name: string, srcPath: string, hz: number) =>
    ipcRenderer.invoke('video:import', name, srcPath, hz) as Promise<number>,
  listVideos: () => ipcRenderer.invoke('video:list') as Promise<Video[]>,

  /* Sport */
  getFields: () => ipcRenderer.invoke('sport:getFields') as Promise<Field[]>,
  resetFields: () => ipcRenderer.invoke('sport:resetFields'),
  flushFields: () => ipcRenderer.invoke('sport:flushFields') as Promise<boolean>,
  getTimestampsOf: (videoId: string) =>
    ipcRenderer.invoke('sport:getTimestampsOf', videoId) as Promise<any[]>,
  getAllTimestamps: () => ipcRenderer.invoke('sport:getAllTimestamps') as Promise<any[]>,
  loadField: (id: number) => ipcRenderer.invoke('sport:loadField', id) as Promise<boolean>,

  /* Misc */
  ping: () => ipcRenderer.send('ping')
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('api', api)
} else {
  console.log('here')
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
