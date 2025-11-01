import { ipcMain, IpcMainInvokeEvent } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import { app } from 'electron';
import { logger } from '../services/logger';

let settings: Record<string, any> = {};
let settingsPath: string;

function initializeSettings() {
  const userDataPath = app.getPath('userData');
  settingsPath = path.join(userDataPath, 'settings.json');

  if (fs.existsSync(settingsPath)) {
    try {
      const data = fs.readFileSync(settingsPath, 'utf-8');
      settings = JSON.parse(data);
    } catch (error) {
      logger.error('Failed to load settings:', error);
      settings = getDefaultSettings();
    }
  } else {
    settings = getDefaultSettings();
    saveSettingsToFile();
  }
}

function getDefaultSettings(): Record<string, any> {
  return {
    editor: {
      fontSize: 14,
      fontFamily: 'Fira Code',
      lineHeight: 21,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      minimap: true,
    },
    theme: {
      id: 'oqool-dark',
      name: 'Oqool Dark',
    },
    terminal: {
      fontSize: 14,
      fontFamily: 'Fira Code',
      shell: process.platform === 'win32' ? 'powershell.exe' : 'bash',
    },
    ai: {
      defaultPersonality: 'sarah',
      model: 'claude-sonnet-4-20250514',
      inlineSuggestionsEnabled: true,
    },
    git: {
      autoFetch: true,
      confirmSync: true,
    },
    locale: 'ar',
  };
}

function saveSettingsToFile() {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (error) {
    logger.error('Failed to save settings:', error);
  }
}

export function settingsHandlers() {
  initializeSettings();

  ipcMain.handle('settings:get', async (_event: IpcMainInvokeEvent, key: string) => {
    try {
      const keys = key.split('.');
      let value: any = settings;

      for (const k of keys) {
        value = value?.[k];
      }

      return { success: true, value };
    } catch (error: any) {
      logger.error('Error getting setting:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('settings:set', async (_event: IpcMainInvokeEvent, key: string, value: any) => {
    try {
      const keys = key.split('.');
      let obj: any = settings;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) {
          obj[keys[i]] = {};
        }
        obj = obj[keys[i]];
      }

      obj[keys[keys.length - 1]] = value;

      saveSettingsToFile();

      return { success: true };
    } catch (error: any) {
      logger.error('Error setting setting:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('settings:getAll', async (_event: IpcMainInvokeEvent) => {
    try {
      return { success: true, settings };
    } catch (error: any) {
      logger.error('Error getting all settings:', error);
      return { success: false, error: error.message };
    }
  });
}
