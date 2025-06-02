import { ElectronAPI } from '@electron-toolkit/preload'

interface Api {
  isFirstRun(): Promise<boolean>
  initNew(appFolder: string, sport: Sport): Promise<void>
  init(sport: Sport): Promise<void>

  /* Settings */
  getSetting(key: string): Promise<string>
  setSetting(key: string, value: string): Promise<void>

  /* Native dialog */
  openFolderDialog(): Promise<string>

  /* Videos */
  importVideo(name: string, srcPath: string, hz: number): Promise<number>
  listVideos(): Promise<Video[]>

  /* Sport */
  getFields(): Promise<BasicField[]>
  resetFields(): Promise<void>
  flushFields(): Promise<boolean>
  getTimestampsOf(videoId: string): Promise<HandballTimestamp[]>
  getAllTimestamps(): Promise<HandballTimestamp[]>
  loadField(id: number): Promise<boolean>

  /* Misc */
  ping(): void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
