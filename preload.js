const { contextBridge, ipcRenderer } = require('electron');

// Expose window control + custom APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  isWindowMaximized: () => ipcRenderer.invoke('is-window-maximized'),
  onWindowMaximizeChanged: (callback) =>
    ipcRenderer.on('window-maximize-changed', (event, isMaximized) =>
      callback(event, isMaximized)
    ),

  // Window management
  newWindow: () => ipcRenderer.invoke('create-new-window'),
  newIncognitoWindow: () => ipcRenderer.invoke('create-new-incognito-window'),
  
  // Tab management
  onOpenNewTab: (callback) => ipcRenderer.on('open-new-tab', (event, url) => callback(event, url)),
  
  // Window type
  onWindowType: (callback) => ipcRenderer.on('window-type', (event, windowType) => callback(event, windowType))
});
