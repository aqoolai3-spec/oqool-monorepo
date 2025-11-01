import { ipcMain } from 'electron';

// Extension IPC Handlers - placeholder for now
export function extensionHandlers() {
  ipcMain.handle('extension:list', async () => {
    return { success: true, extensions: [] };
  });

  ipcMain.handle('extension:install', async (_event, extensionPath: string) => {
    return { success: false, error: 'Not implemented yet' };
  });

  ipcMain.handle('extension:uninstall', async (_event, extensionId: string) => {
    return { success: false, error: 'Not implemented yet' };
  });

  ipcMain.handle('extension:enable', async (_event, extensionId: string) => {
    return { success: false, error: 'Not implemented yet' };
  });

  ipcMain.handle('extension:disable', async (_event, extensionId: string) => {
    return { success: false, error: 'Not implemented yet' };
  });
}
