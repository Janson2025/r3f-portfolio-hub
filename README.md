# R3F Portfolio Hub

An interactive 3D portfolio hub built with **React Three Fiber** and **drei MeshPortalMaterial**.  
The hub renders a Rubik’s-cube–like grid of blocks. Each block can display stickers (flat faces), and some stickers are **portal stickers**: clicking them transitions into a project site, embedded via an iframe overlay.

This repo is the **hub only**. Each project is a separate standalone static site (often also built with R3F). The hub connects to them via configured URLs.

---

## 🧭 Project Goals
- Showcase multiple projects in one immersive 3D environment.
- Keep the hub simple and reusable; each project can have its own backend or stack.
- Allow **seamless transitions**: portal blend → reveal project iframe.
- Make the architecture **config-driven**: grids, blocks, stickers, scene settings all come from JSON parameter files.

---

## 🏗️ Architecture Overview

### Layers
1. **Scene (`scene/`)**  
   - Controls camera, lights, background, and the **iframe overlay** for projects.  
   - State/logic is handled via `useOverlayController` (Esc/back, preconnect, ready state).  
   - `<ProjectOverlay />` renders the iframe and listens for postMessage events.

2. **Grid (`grid/`)**  
   - Renders a 3D grid of blocks based on `grid/params/grid.json`.  
   - Each block gets assigned stickers from `sticker/params/stickers.json`.

3. **Block (`block/`)**  
   - A single cube element. Owns block-level material, idle animations, and sticker placement.  
   - Faces are flattened slightly to hold stickers.

4. **Sticker (`sticker/`)**  
   - Represents a face of a block.  
   - Can be `plain` (colored face) or `portal` (with MeshPortalMaterial + preview scene).  
   - Handles portal blend animation. When finished, triggers `onActivateSticker(href)`.

5. **Shared (`shared/`)**  
   - Utility functions: math, easing, constants, (optional) event bus.

---

## 📂 File Structure
node_modules
public
src
│   App.jsx
│   index.css
│   main.jsx
│   
├───block
│   │   Block.jsx
│   │
│   ├───animations
│   │       useBlockIdle.js
│   │
│   ├───interactions
│   │       useBlockInteractions.js
│   │
│   ├───materials
│   │       blockMaterial.js
│   │
│   └───params
│           block.json
│
├───grid
│   │   GridCube.jsx
│   │
│   ├───animations
│   │       useGridIdle.js
│   │
│   ├───interactions
│   │       useGridInteractions.js
│   │
│   └───params
│           grid.json
│
├───scene
│   │   ProjectOverlay.jsx
│   │   SceneRoot.jsx
│   │
│   ├───animations
│   │       useSceneIdle.js
│   │
│   ├───interactions
│   │       sceneControls.js
│   │       useOverlayController.js
│   │
│   └───params
│           scene.json
│
├───shared
│       constants.js
│       easing.js
│       math.js
│       pubsub.js
│
└───sticker
    │   Sticker.jsx
    │
    ├───animations
    │       useStickerIdle.js
    │
    ├───interactions
    │       useStickerInteractions.js
    │
    ├───materials
    │       stickerMaterials.js
    │
    └───params
            stickers.json
.gitIgnore
index.html
package-lock.json
package.json
prittier.config.js
README.md
TailwindConfig.js
vite.config.js
yarn.lock
---

## ⚙️ Config Files

- **`scene/params/scene.json`** → background color, camera defaults, lights.  
- **`grid/params/grid.json`** → grid size & spacing.  
- **`block/params/block.json`** → block size, material props, idle animation.  
- **`sticker/params/stickers.json`** → which block/face has a sticker, type, and project URL.

Example `sticker` config:
```json
[
  {
    "id": "character-config",
    "block": [0,0,0],
    "face": "front",
    "type": "portal",
    "href": "https://r3f-new-character-configurator.onrender.com/",
    "preview": { "style": "cube-normal", "color": "#7ec8ff" },
    "idle": { "spin": 0.6 }
  }
]

Tech Stack

React Three Fiber

drei

TailwindCSS

Vite + Yarn (static site deployment)

Hosted on Render