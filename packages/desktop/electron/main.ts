import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import { fileSystemHandlers } from './ipc/file-system';
import { terminalHandlers } from './ipc/terminal';
import { aiHandlers } from './ipc/ai';
import { settingsHandlers } from './ipc/settings';
import { gitHandlers } from './ipc/git';
import { extensionHandlers } from './ipc/extensions';
import { logger } from './services/logger';
import { setupAutoUpdater } from './services/updater';
import { createApplicationMenu } from './menu';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1e1e1e',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
    show: false,
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    logger.info('Main window shown');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menu = createApplicationMenu();
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  logger.info('App ready, creating window');
  
  fileSystemHandlers();
  terminalHandlers();
  aiHandlers();
  settingsHandlers();
  gitHandlers();
  extensionHandlers();
  
  createWindow();
  setupAutoUpdater();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});
