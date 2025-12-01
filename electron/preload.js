const { contextBridge, ipcRenderer } = require('electron');

// Expose API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Örnek API: ana süreç ile iletişim için
  ping: () => ipcRenderer.invoke('ping'),
  
  // Uygulama bilgisi alma
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Dosya sistemi işlemleri
  saveFile: (data, filename) => ipcRenderer.invoke('save-file', data, filename),
  openFile: () => ipcRenderer.invoke('open-file'),
  
  // Yazıcı işlemleri
  print: (content) => ipcRenderer.invoke('print', content)
});

// Güvenli API'leri pencereye ekle
contextBridge.exposeInMainWorld('electron', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  print: (content, settings) => ipcRenderer.invoke('print', content, settings),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  exportData: (data) => ipcRenderer.invoke('export-data', data),
  importData: () => ipcRenderer.invoke('import-data')
}); 