import { ipcMain, IpcMainInvokeEvent } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import chokidar from 'chokidar';
import { logger } from '../services/logger';

const watchers = new Map<string, chokidar.FSWatcher>();

export function fileSystemHandlers() {
  ipcMain.handle('fs:read', async (_event: IpcMainInvokeEvent, filePath: string) => {
    try {
      logger.debug('Reading file:', filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      return { success: true, content };
    } catch (error: any) {
      logger.error('Error reading file:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:write', async (_event: IpcMainInvokeEvent, filePath: string, content: string) => {
    try {
      logger.debug('Writing file:', filePath);
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true };
    } catch (error: any) {
      logger.error('Error writing file:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:readdir', async (_event: IpcMainInvokeEvent, dirPath: string) => {
    try {
      logger.debug('Reading directory:', dirPath);
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      const items = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(dirPath, entry.name);
          const stats = await fs.stat(fullPath);
          
          return {
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            isFile: entry.isFile(),
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime,
          };
        })
      );
      
      return { success: true, items };
    } catch (error: any) {
      logger.error('Error reading directory:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:mkdir', async (_event: IpcMainInvokeEvent, dirPath: string) => {
    try {
      logger.debug('Creating directory:', dirPath);
      await fs.ensureDir(dirPath);
      return { success: true };
    } catch (error: any) {
      logger.error('Error creating directory:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:delete', async (_event: IpcMainInvokeEvent, targetPath: string) => {
    try {
      logger.debug('Deleting:', targetPath);
      await fs.remove(targetPath);
      return { success: true };
    } catch (error: any) {
      logger.error('Error deleting:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:rename', async (_event: IpcMainInvokeEvent, oldPath: string, newPath: string) => {
    try {
      logger.debug('Renaming:', oldPath, 'to', newPath);
      await fs.rename(oldPath, newPath);
      return { success: true };
    } catch (error: any) {
      logger.error('Error renaming:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:exists', async (_event: IpcMainInvokeEvent, targetPath: string) => {
    try {
      const exists = await fs.pathExists(targetPath);
      return { success: true, exists };
    } catch (error: any) {
      logger.error('Error checking existence:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:watch', async (event: IpcMainInvokeEvent, dirPath: string, watchId: string) => {
    try {
      logger.debug('Setting up watcher for:', dirPath);
      
      if (watchers.has(watchId)) {
        await watchers.get(watchId)?.close();
      }

      const watcher = chokidar.watch(dirPath, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true,
        depth: 10,
      });

      watcher
        .on('add', (filePath) => {
          event.sender.send('fs:watcher-event', {
            type: 'add',
            path: filePath,
            watchId,
          });
        })
        .on('change', (filePath) => {
          event.sender.send('fs:watcher-event', {
            type: 'change',
            path: filePath,
            watchId,
          });
        })
        .on('unlink', (filePath) => {
          event.sender.send('fs:watcher-event', {
            type: 'unlink',
            path: filePath,
            watchId,
          });
        })
        .on('addDir', (dirPath) => {
          event.sender.send('fs:watcher-event', {
            type: 'addDir',
            path: dirPath,
            watchId,
          });
        })
        .on('unlinkDir', (dirPath) => {
          event.sender.send('fs:watcher-event', {
            type: 'unlinkDir',
            path: dirPath,
            watchId,
          });
        });

      watchers.set(watchId, watcher);
      return { success: true };
    } catch (error: any) {
      logger.error('Error setting up watcher:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('fs:unwatch', async (_event: IpcMainInvokeEvent, watchId: string) => {
    try {
      const watcher = watchers.get(watchId);
      if (watcher) {
        await watcher.close();
        watchers.delete(watchId);
      }
      return { success: true };
    } catch (error: any) {
      logger.error('Error closing watcher:', error);
      return { success: false, error: error.message };
    }
  });
}
