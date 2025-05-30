import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      openVideo: () => Promise<string | null>
      saveCutout: (c: {
        video_path: string
        start: number
        end: number
        label: string
        zone: number
        categories: string[]
      }) => Promise<void>
      loadCutouts: (
        videoPath: string
      ) => Promise<
        Array<{
          video_path: string
          start: number
          end: number
          label: string
          zone: number
          categories: string[]
        }>
      >
      loadAllCutouts: () => Promise<
        Array<{
          video_path: string
          start: number
          end: number
          label: string
          zone: number
          categories: string[]
        }>
      >
    }
  }
}
