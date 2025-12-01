const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { BrowserWindow } = require('electron');

// Electron uygulamasından localStorage verilerini export et
// Bu script Electron uygulaması içinde çalıştırılmalı

function exportLocalStorageData() {
  // Electron uygulamasının localStorage path'ini bul
  const userDataPath = app.getPath('userData');
  const localStoragePath = path.join(userDataPath, 'Local Storage', 'leveldb');
  
  console.log('LocalStorage path:', localStoragePath);
  
  // LevelDB'den veri okumak için 'level' paketi gerekir
  // Alternatif: BrowserWindow ile localStorage'a eriş
  
  // En kolay yol: Uygulamadan export butonuna tıklamak
  // Bu script sadece path'i gösterir
  return localStoragePath;
}

// Alternatif: Electron uygulamasına IPC handler ekle
// electron/main.js dosyasına eklenebilir:
/*
ipcMain.handle('export-all-data', async () => {
  // BrowserWindow'dan localStorage verilerini al
  const data = await mainWindow.webContents.executeJavaScript(`
    JSON.stringify({
      stones: JSON.parse(localStorage.getItem('mercansoft-storage') || '{}').state?.stones || [],
      models: JSON.parse(localStorage.getItem('mercansoft-storage') || '{}').state?.models || [],
      stoneSets: JSON.parse(localStorage.getItem('mercansoft-storage') || '{}').state?.stoneSets || []
    })
  `);
  return JSON.parse(data);
});
*/

console.log(`
Electron uygulamasından veri export etmek için:

1. YÖNTEM (Önerilen):
   - Electron uygulamasını açın
   - Sistem Ayarları > Veri Yönetimi > Verileri Dışa Aktar
   - JSON dosyasını kaydedin
   - migrate-local-data.js script'ini çalıştırın

2. YÖNTEM (Manuel):
   - Electron uygulamasını açın
   - Developer Tools'u açın (Ctrl+Shift+I)
   - Console'da şunu çalıştırın:
     localStorage.getItem('mercansoft-storage')
   - Çıkan JSON'u kopyalayıp bir dosyaya kaydedin
   - migrate-local-data.js script'ini çalıştırın

3. YÖNTEM (Programatik):
   - electron/main.js dosyasına export handler ekleyin
   - Uygulamadan verileri programatik olarak export edin
`);

