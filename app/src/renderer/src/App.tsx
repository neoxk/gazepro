import { useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import { NavBar } from './components/NavBar'
import { SidePanel } from './components/SidePanel'
import { SavedVideos } from './components/SavedVideos'
import { VideoEditor } from './components/VideoEditor'
import { Training } from './components/Training'

export default function App(): React.JSX.Element {
  const [selectedVideoPath, setSelectedVideoPath] = useState<string | null>(null)
  const [videoList, setVideoList] = useState<string[]>([])

  const handleOpenFolder = async () => {
    const paths: string[] = await (window.api as any).openFolder()
    if (paths.length > 0) {
      setVideoList(paths)
      setSelectedVideoPath(paths[0])
    }
  }

  const location = useLocation()

  return (
    <>
      <NavBar />

      <div className="app-scroll-container">
        {location.pathname === '/' && (
          <SidePanel
            videoList={videoList}
            selectedVideoPath={selectedVideoPath}
            onVideoSelect={setSelectedVideoPath}
            onOpenFolder={handleOpenFolder}
          />
        )}

        <Routes>
          <Route
            path="/"
            element={<VideoEditor selectedVideoPath={selectedVideoPath} />}
          />
          <Route path="/saved" element={<SavedVideos />} />
          <Route path="/training" element={<Training />} />
        </Routes>
      </div>
    </>
  )
}
