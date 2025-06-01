import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      openFolder: () => Promise<string[]>
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
      deleteCutout: (id: number) => Promise<void>
      saveCutoutWithThumbnail: (payload: {
        video_path: string
        start: number
        end: number
        label: string
        zone: number
        categories: string[]
        thumbnailDataUrl: string
      }) => Promise<void>
    }
  }
}
