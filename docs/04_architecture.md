# Architecture

## Overview

ThreadAuto follows a standard Electron architecture with main process, preload scripts, and renderer process.

```
┌─────────────────────────────────────────────────┐
│                  Electron App                    │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐      ┌──────────────────────┐ │
│  │ Main Process │      │   Renderer Process   │ │
│  │              │      │                      │ │
│  │ - IPC Handler│ IPC  │ - React Components   │ │
│  │ - Store      │<────>│ - UI State           │ │
│  │ - Gemini API │      │ - User Interactions  │ │
│  └──────────────┘      └──────────────────────┘ │
│         │                                       │
│         ▼                                       │
│  ┌──────────────┐                               │
│  │electron-store│                               │
│  │  (JSON file) │                               │
│  └──────────────┘                               │
└─────────────────────────────────────────────────┘
          │
          ▼ HTTPS
┌─────────────────┐
│  Gemini API     │
│  (External)     │
└─────────────────┘
```

## Directory Structure

```
apps/desktop/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Entry point, window creation
│   │   ├── store.ts    # electron-store configuration
│   │   └── ipc.ts      # IPC handlers
│   ├── preload/        # Context bridge
│   │   ├── index.ts    # API exposure
│   │   └── index.d.ts  # Type definitions
│   └── renderer/       # React application
│       ├── App.tsx     # Root component
│       ├── components/ # UI components
│       ├── types/      # TypeScript types
│       └── styles/     # CSS/Tailwind
├── package.json
├── electron.vite.config.ts
└── electron-builder.yml
```

## Data Flow

1. **User Action** -> React Component
2. **Component** -> IPC Invoke (via preload API)
3. **Main Process** -> Handle IPC, interact with Store/Gemini
4. **Response** -> IPC Reply
5. **Component** -> Update UI State

## Key Design Decisions

### electron-store for Persistence
- Simple JSON-based storage
- No database overhead
- Automatic file handling

### IPC for All External Operations
- API calls happen in main process
- Renderer has no direct network access
- Better security model

### Tailwind CSS for Styling
- Rapid UI development
- Consistent design system
- Small bundle size with purging
