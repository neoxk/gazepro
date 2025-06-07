import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom';
import App from './App'
import TrainProjection from './components/TrainProjection';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/*"          element={<App />} />
        <Route path="/trainprojection"      element={<TrainProjection />} />
      </Routes>
    </HashRouter>
  </StrictMode>
)
