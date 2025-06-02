import { useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import { NavBar } from './components/NavBar'
import { SidePanel } from './components/SidePanel'
import { SavedVideos } from './components/SavedVideos'
import { VideoEditor } from './components/VideoEditor'
import { Training } from './components/Training'
import { Home } from './components/Home'
// import Initializer from './core/Initializer'
// import SportController from './core/modules/SportController'
// import VideoController, { Video } from './core/video/VideoController'

interface Video {
  id: number
  name: string
  refresh_rate: number
  path: string
  sport: string
}

export default function App(): React.JSX.Element {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [videoList, setVideoList] = useState<Video[]>([])
  const [appStarted, setAppStarted] = useState(false)
  // const [initializer, setInitializer] = useState<Initializer>(new Initializer())
  const [appPath, setAppPath] = useState('')
  // const [sportController, setSportController] = useState<SportController>()

  const api: any = window.api

  const handleOpenFolder = async () => {
    const path = await (window.api as any).openFolder()
    // if (paths.length > 0) {
    //   setVideoList(paths)
    //   setSelectedVideoPath(paths[0])
    // }
    setAppPath(path)
    return path
  }

  const load = () => {
    // VideoController.getVideos().then((videos) => setVideoList(videos))
  }

  const handleContinue = () => {
    //TODO Sport je hardcodan
    // initializer.initNew(appPath, Sport.HANDBALL)
    // setSportController(initializer.getSportController)
    // load()
    // setAppStarted(true)
  }

  const location = useLocation()

  useEffect(() => {
    if (api.isFirstRun()) {
      setAppStarted(true)
    }
  }, [])

  return (
    <>
      {!appStarted ? (
        <Home onContinue={handleContinue} onOpenFolder={handleOpenFolder} />
      ) : (
        <>
          <NavBar />
          <div className="app-scroll-container">
            {location.pathname === '/' && (
              <SidePanel
                videoList={videoList}
                selectedVideo={selectedVideo}
                onVideoSelect={setSelectedVideo}
              />
            )}

            <Routes>
              <Route path="/" element={<VideoEditor selectedVideo={selectedVideo} />} />
              <Route path="/saved" element={<SavedVideos />} />
              <Route path="/training" element={<Training />} />
            </Routes>
          </div>
        </>
      )}
    </>
  )
}
