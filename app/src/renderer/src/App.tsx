import { useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { NavBar } from './components/NavBar';
import { SidePanel } from './components/SidePanel';
import { SavedVideos } from './components/SavedVideos';
import { VideoEditor } from './components/VideoEditor';
import { Training } from './components/Training';


function App(): React.JSX.Element {
  const [selectedVideoPath, setSelectedVideoPath] = useState<string | null>(null);
  const location = useLocation();

  return (
    <>
      <NavBar />
      <div className="app-scroll-container">
  {location.pathname === '/' && (
    <SidePanel onVideoSelect={setSelectedVideoPath} />
  )}
  <Routes>
    <Route path="/" element={<VideoEditor selectedVideoPath={selectedVideoPath} />} />
    <Route path="/saved" element={<SavedVideos />} />
    <Route path="/training" element={<Training />} />
  </Routes>
</div>
    </>
  );
}

export default App
