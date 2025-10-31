import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

const validChannels = {
  send: [
    'fs:read',
    'fs:write',
    'fs:readdir',
    'fs:mkdir',
    'fs:delete',
    'fs:rename',
    'fs:exists',
    'fs:watch',
    'terminal:create',
    'terminal:write',
    'terminal:resize',
    'terminal:kill',
    'ai:call',
    'ai:stream',
    'ai:inline-suggest',
    'settings:get',
    'settings:set',
    'settings:getAll',
    'git:status',
    'git:commit',
    'git:push',
    'git:pull',
    'git:diff',
    'extension:install',
    'extension:uninstall',
    'extension:list',
    'window:minimize',
    'window:maximize',
    'window:close',
  ],
  on: [
    'terminal:data',
    'fs:watcher-event',
    'extension:loaded',
    'ai:stream-data',
    'update:available',
    'update:downloaded',
  ],
};

contextBridge.exposeInMainWorld('electron', {
  invoke: async (channel: string, ...args: any[]) => {
    if (validChannels.send.includes(channel)) {
      return await ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invalid channel: ${channel}`);
  },

  on: (channel: string, callback: (...args: any[]) => void) => {
    if (validChannels.on.includes(channel)) {
      const subscription = (_event: IpcRendererEvent, ...args: any[]) => {
        callback(...args);
      };
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
    throw new Error(`Invalid channel: ${channel}`);
  },

  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    if (validChannels.on.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  },
});

contextBridge.exposeInMainWorld('platform', {
  os: process.platform,
  arch: process.arch,
  version: process.versions,
});
