import { ipcMain, IpcMainInvokeEvent, dialog } from 'electron';
import { logger } from '../services/logger';

export function dialogHandlers() {
  // Show Open Dialog
  ipcMain.handle('dialog:showOpenDialog', async (_event: IpcMainInvokeEvent, options: any) => {
    try {
      logger.debug('Showing open dialog with options:', options);
      const result = await dialog.showOpenDialog(options);
      return { success: true, ...result };
    } catch (error: any) {
      logger.error('Error showing open dialog:', error);
      return { success: false, error: error.message };
    }
  });

  // Show Save Dialog
  ipcMain.handle('dialog:showSaveDialog', async (_event: IpcMainInvokeEvent, options: any) => {
    try {
      logger.debug('Showing save dialog with options:', options);
      const result = await dialog.showSaveDialog(options);
      return { success: true, ...result };
    } catch (error: any) {
      logger.error('Error showing save dialog:', error);
      return { success: false, error: error.message };
    }
  });
}
