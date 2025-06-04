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
        shotHand: string
        defended: string
        position: string
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
          shotHand: string
          defended: string
          position: string
        }>
      >
      loadAllCutouts: () => Promise<
        Array<{
          video_path: string
          start: number
          end: number
          label: string
          zone: number
          shotHand: string
          defended: string
          position: string
        }>
      >
      deleteCutout: (id: number) => Promise<void>
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
      }) => Promise<void>
      updateCutout: (
        id: number,
        payload: {
          video_path: string
          start: number
          end: number
          label: string
          zone: number
          shotHand: string
          defended: string
          position: string
          thumbnailDataUrl: string
        }
      ) => Promise<void>
      getFrameRate: (filePath: string) => Promise<{ fps: number }>
    }
  }
}
