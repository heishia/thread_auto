# Development Guide

## Prerequisites

- Node.js 20+
- npm 10+
- Windows (for building Windows executable)

## Setup

```bash
cd apps/desktop
npm install
```

## Development

```bash
npm run dev
```

This starts electron-vite in development mode with hot reload.

## Project Structure

| Path | Description |
|------|-------------|
| `src/main/` | Electron main process |
| `src/preload/` | Context bridge scripts |
| `src/renderer/` | React application |

## Adding New Features

### Adding a New IPC Handler

1. Define handler in `src/main/ipc.ts`
2. Add type in `src/preload/index.d.ts`
3. Expose in `src/preload/index.ts`
4. Use in renderer via `window.api`

### Adding a New Component

1. Create file in `src/renderer/components/`
2. Import and use in parent component
3. Add types in `src/renderer/types/` if needed

## Building

```bash
npm run build
```

This runs electron-vite build and electron-builder.

Output is in `dist/` directory.

## Linting

```bash
npm run lint
```

## Release Process

1. Commit and push changes
2. Create GitHub Release with tag (e.g., v1.0.0)
3. GitHub Actions automatically builds and uploads executable

## Troubleshooting

### API Key Not Working
- Verify key at https://aistudio.google.com/app/apikey
- Check if free tier limits are exceeded

### Build Fails
- Ensure all dependencies are installed
- Check Node.js version (20+ required)

### Hot Reload Not Working
- Restart dev server
- Clear Vite cache: `rm -rf node_modules/.vite`
