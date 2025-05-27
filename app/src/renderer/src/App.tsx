import { useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { NavBar } from './components/NavBar';
import { SidePanel } from './components/SidePanel';
import { SavedVideos } from './components/SavedVideos';
import { VideoEditor } from './components/VideoEditor';


function App(): React.JSX.Element {
  const [selectedVideoPath, setSelectedVideoPath] = useState<string | null>(null);
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname === '/saved') return 'Saved Videos';
    return 'Video Editor';
  };

  return (
    <>
      <NavBar activePage={getPageTitle()} />
      {location.pathname === '/' && (
        <SidePanel onVideoSelect={setSelectedVideoPath} />
      )}
      <Routes>
        <Route path="/" element={<VideoEditor selectedVideoPath={selectedVideoPath} />} />
        <Route path="/saved" element={<SavedVideos />} />
      </Routes>
    </>
  );
}

export default App
