# ThreadAuto

Threads SNS post auto-generator desktop application.

## Overview

ThreadAuto is a desktop application that automatically generates Threads posts using Google Gemini AI. It supports 4 types of posts and can generate content on-demand or automatically at set intervals.

## Quick Start

```bash
cd apps/desktop
npm install
npm run dev
```

## Features

- **4 Post Types**: Aggro, Proof, Brand, Insight
- **AI-Powered**: Uses Google Gemini API for content generation
- **Auto Generation**: Scheduled post generation (configurable interval)
- **Notion-style UI**: Clean, minimal interface
- **Copy to Clipboard**: One-click copy for easy posting

## Architecture

```
thread_auto/
├── apps/desktop/       # Electron + React application
├── .github/workflows/  # CI/CD (GitHub Actions)
└── docs/               # Documentation
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Desktop | Electron |
| Frontend | React + TypeScript |
| AI | Google Gemini API |
| Storage | electron-store |
| Styling | Tailwind CSS |

## Documentation

- [Overview](docs/00_overview.md)
- [Requirements](docs/01_requirements.md)
- [Domain](docs/02_domain.md)
- [Use Cases](docs/03_usecases.md)
- [Architecture](docs/04_architecture.md)
- [API](docs/05_api.md)
- [Dev Guide](docs/06_dev_guide.md)

## Release

Releases are triggered by GitHub Release creation. Windows executable is automatically built and uploaded.

## License

Private
