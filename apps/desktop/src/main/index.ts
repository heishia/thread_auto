import { app, shell, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers, startAutoGeneration, stopAutoGeneration, getAutoGenerationStatus, startHourlyReminder, stopHourlyReminder, getHourlyReminderStatus } from './ipc'
import { getConfig, setConfig } from './store'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

function getIconPath(): string {
  if (is.dev) {
    return join(__dirname, '../../../../asset/favicon.ico')
  }
  return join(process.resourcesPath, 'asset/favicon.ico')
}

function createTray(): void {
  const iconPath = getIconPath()
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon.resize({ width: 16, height: 16 }))
  
  updateTrayMenu()
  
  tray.setToolTip('Thread Auto - 자동 게시물 생성')
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus()
      } else {
        mainWindow.show()
      }
    } else {
      createWindow()
    }
  })
}

function updateTrayMenu(): void {
  if (!tray) return
  
  const autoStatus = getAutoGenerationStatus()
  const publishStatus = getHourlyReminderStatus()
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Thread Auto 열기',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        } else {
          createWindow()
        }
      }
    },
    { type: 'separator' },
    {
      label: autoStatus.enabled ? '자동 생성 중지' : '자동 생성 시작',
      click: () => {
        if (autoStatus.enabled) {
          stopAutoGeneration()
          setConfig({ autoGenerateEnabled: false })
        } else {
          setConfig({ autoGenerateEnabled: true })
          startAutoGeneration()
        }
        updateTrayMenu()
      }
    },
    {
      label: `자동 생성: ${autoStatus.enabled ? `${autoStatus.interval}분 간격` : '비활성화'}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: publishStatus.enabled ? '정각 알림 중지' : '정각 알림 시작',
      click: () => {
        if (publishStatus.enabled) {
          stopHourlyReminder()
          setConfig({ hourlyReminderEnabled: false })
        } else {
          setConfig({ hourlyReminderEnabled: true })
          startHourlyReminder()
        }
        updateTrayMenu()
      }
    },
    {
      label: `정각 알림: ${publishStatus.enabled ? '활성화' : '비활성화'}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: '완전히 종료',
      click: () => {
        isQuitting = true
        stopAutoGeneration()
        stopHourlyReminder()
        app.quit()
      }
    }
  ])
  
  tray.setContextMenu(contextMenu)
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon: getIconPath(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      backgroundThrottling: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    if (is.dev) {
      mainWindow?.webContents.openDevTools()
    }
  })

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
      return false
    }
    return true
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.threadauto.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  createTray()
  createWindow()

  const config = getConfig()
  if (config.autoGenerateEnabled) {
    startAutoGeneration()
  }
  
  // 정각 알림 자동 시작
  if (config.hourlyReminderEnabled) {
    startHourlyReminder()
  }

  setInterval(() => {
    updateTrayMenu()
  }, 60000)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else if (mainWindow) {
      mainWindow.show()
    }
  })
})

app.on('window-all-closed', () => {
  // 트레이에서 계속 실행되므로 앱을 종료하지 않음
})

app.on('before-quit', () => {
  isQuitting = true
})
