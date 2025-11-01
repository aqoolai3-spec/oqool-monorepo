// Simple Electron entry point with IPC support
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// إخفاء القائمة تماماً
Menu.setApplicationMenu(null);

console.log('============================================================');
console.log('🚀 OQOOL DESKTOP IDE');
console.log('============================================================');
console.log('Platform:', process.platform);
console.log('Arch:', process.arch);
console.log('Electron:', process.versions.electron);
console.log('Node:', process.versions.node);
console.log('============================================================');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#1e1e1e',
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'dist', 'electron', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Always load from localhost:5173 in development
  const distExists = require('fs').existsSync(path.join(__dirname, 'dist', 'index.html'));
  const isDev = !distExists || process.argv.includes('--dev');

  console.log('🔍 isDev:', isDev);
  console.log('🔍 distExists:', distExists);
  console.log('🔍 preload path:', path.join(__dirname, 'dist', 'electron', 'preload.js'));

  if (isDev) {
    const url = 'http://localhost:5173';
    console.log(`📡 Loading from: ${url}`);
    mainWindow.loadURL(url);
    mainWindow.webContents.openDevTools();
  } else {
    console.log('📦 Loading from dist folder');
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function initializeIPCHandlers() {
  // Dynamically load IPC handlers if they exist
  try {
    const handlersPath = path.join(__dirname, 'dist', 'electron', 'ipc');
    console.log('📦 Loading IPC handlers from:', handlersPath);

    const aiHandlersFile = path.join(handlersPath, 'ai.js');
    const settingsHandlersFile = path.join(handlersPath, 'settings.js');
    const dialogHandlersFile = path.join(handlersPath, 'dialog.js');
    const fileSystemHandlersFile = path.join(handlersPath, 'file-system.js');

    if (require('fs').existsSync(aiHandlersFile)) {
      const { setupAIHandlers } = require(aiHandlersFile);
      setupAIHandlers();
      console.log('✅ AI handlers loaded');
    }

    if (require('fs').existsSync(settingsHandlersFile)) {
      const { settingsHandlers } = require(settingsHandlersFile);
      settingsHandlers();
      console.log('✅ Settings handlers loaded');
    }

    if (require('fs').existsSync(dialogHandlersFile)) {
      const { dialogHandlers } = require(dialogHandlersFile);
      dialogHandlers();
      console.log('✅ Dialog handlers loaded');
    }

    if (require('fs').existsSync(fileSystemHandlersFile)) {
      const { setupFileSystemHandlers } = require(fileSystemHandlersFile);
      setupFileSystemHandlers();
      console.log('✅ File System handlers loaded');
    }
  } catch (error) {
    console.error('⚠️ Failed to load IPC handlers:', error.message);
  }
}

app.whenReady().then(() => {
  initializeIPCHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
