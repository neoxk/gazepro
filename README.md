<div align="center">

  <img src="./app/src/renderer/src/assets/images/logo-2.png" alt="logo" width="120" height="auto" />
  
  <h1> GazePro Reflex Training </h1>
  
  <p>
    Train the Mind. Sharpen the Reflex.
  </p>

</div>

<br>

**GazePro Reflex Training** is a desktop application designed to support perceptual-reaction training of sports goalkeepers, primarily in handball. The app allows trainers to store, tag, cut, and play video clips as part of customizable training sessions. Developed in collaboration with a handball team, it is aimed at enhancing athlete reflexes and situational awareness through real-time feedback and video-based exercises.

<br>

## 🧠 Project Goal

To deliver a training platform that helps handball coaches create perceptual-reaction exercises using real match video material. The application allows for:
- Importing and trimming game footage
- Tagging critical clips with zones, shooter positions, and other metadata
- Organizing clips into training sequences
- Projecting video segments during training
- Capturing athlete responses for post-session analysis

<br>

## ⚙️ Features

### ✅ Video Management
- Upload full-length videos
- Trim segments (cutouts) based on start and end times
- Annotate clips with:
  - Zone (1–9)
  - Shooter position (e.g., Left Wing, Pivot)
  - Shot hand (left/right)
  - Was it defended?

### 🧩 Cutout Tagging
- Fully interactive form for labeling metadata
- Flags to mark critical events
- Tooltip overlays on timeline with auto-scroll to editor

### 🎯 Training Module
- Organize clips into training series
- Customize:
  - Clips per series
  - Playback speed
  - Pause between clips/series
- Play snippets and record expected vs. actual zone
- Keyboard shortcuts for fast input

### 📊 Post-Training Analytics
- Review all responses
- Edit actual responses if needed
- Generate basic statistical summaries of performance

### 🌍 Multilingual Support
- English 🇺🇸
- Slovenian 🇸🇮

<br>

## 🧱 Tech Stack

| Layer          | Technology                  |
|----------------|-----------------------------|
| Framework      | Electron + Vite             |
| Frontend       | React, TypeScript           |
| Styling        | Bootstrap                   |
| Icons          | Bootstrap Icons             |
| State          | React Hooks                 |
| Localization   | i18next                     |

<br>

## 🛠️ Installation

To set up and run this project locally, follow the steps below:

1. Clone the repository:
   ```bash
   git clone https://github.com/neoxk/gazepro.git
   
    ```

2. Navigate to the project directory:
    ```bash
    cd gazepro
    ```

3. Install dependencies:
    ```bash
    npm install
    ```

4. Run the Application:
    ```bash
    npm run dev
    ```

5. Build for Production:
    ```bash
    npm run build
    npm run package
    ```
    This will generate a distributable version for your OS (Windows/Mac/Linux).

<br>

## 📂 Directory Structure
  ```bash
  /src
  ├── main/                             # Electron main process entry
  ├── preload/                          # Preload scripts for Electron context bridging
  ├── renderer/                         # Renderer (frontend) logic
  │   ├── src/
  │   │   ├── assets/                   # Static assets like images and styles
  │   │   │   ├── images/               # Image files (logos, icons, etc.)
  │   │   │   ├── base.css              # Base styling
  │   │   │   └── main.css              # Main styling
  │   │   ├── components/               # React components (UI and layout)
  │   │   ├── core/                     # Business logic and service classes
  │   │   │   ├── modules/              # Structured logic for cutouts/training
  │   │   │   │   ├── fields/           # Field-specific logic
  │   │   │   │   └── handball/         # Handball-related logic
  │   │   │   ├── settings/             # Application settings and config
  │   │   │   ├── const.ts              # Constants and enums
  │   │   │   ├── DBService.ts          # IndexedDB service for persistence
  │   │   │   ├── Initializer.ts        # Startup initialization logic
  │   │   │   ├── TrainingController.ts # Training module logic
  │   │   │   ├── CutoutsController.ts  # Cutout handling logic
  │   │   │   ├── TSFields.ts           # TypeScript types for fields
  │   │   │   ├── TSService.ts          # Shared service logic
  │   │   │   └── util.ts               # Utility functions
  │   │   ├── locales/                  # Translation JSON files
  │   │   ├── App.tsx                   # Root component
  │   │   ├── env.d.ts                  # Environment typings
  │   │   ├── i18n.ts                   # i18next initialization
  │   │   └── main.tsx                  # React renderer entry
  └── index.html                        # HTML entry point for Vite
  ```

<br>

## 👥 Team Members

- Neo Xander Kirbiš
- Gal Petelin
- Ena Imamović

<br>

## 📄 License

Distributed under the MIT License. See `LICENSE.txt` for more information.
