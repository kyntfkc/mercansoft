const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 1200,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  if (isDev) {
    // Next.js'in başlangıç portu
    mainWindow.loadURL('http://localhost:3000');
    
    // DevTools'u kapalı tutuyoruz
    // mainWindow.webContents.openDevTools();
  } else {
    // Üretim modunda static dosyaları yükle
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

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

// IPC iletişimi burada tanımlanabilir
ipcMain.handle('ping', () => 'pong');

// Uygulama versiyonunu döndürür
ipcMain.handle('get-app-version', () => app.getVersion());

// Dosya kaydetme işlemi - Dışa aktarma
ipcMain.handle('save-file', async (event, data, defaultFileName) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Verileri Dışa Aktar',
      defaultPath: defaultFileName || 'mercansoft-veriler.json',
      filters: [
        { name: 'JSON', extensions: ['json'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, message: 'İşlem iptal edildi' };
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, message: 'Veriler başarıyla dışa aktarıldı', filePath };
  } catch (error) {
    console.error('Dosya kaydetme hatası:', error);
    return { success: false, message: 'Dosya kaydedilirken bir hata oluştu: ' + error.message };
  }
});

// Dosya açma işlemi - İçe aktarma
ipcMain.handle('open-file', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Verileri İçe Aktar',
      properties: ['openFile'],
      filters: [
        { name: 'JSON', extensions: ['json'] }
      ]
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, message: 'İşlem iptal edildi' };
    }

    const data = fs.readFileSync(filePaths[0], 'utf-8');
    const jsonData = JSON.parse(data);
    
    return { success: true, data: jsonData, message: 'Veriler başarıyla içe aktarıldı' };
  } catch (error) {
    console.error('Dosya açma hatası:', error);
    return { success: false, message: 'Dosya açılırken bir hata oluştu: ' + error.message };
  }
});

// Yazdırma işlemini ele al
ipcMain.handle('print', async (event, content, settings = {}) => {
  return new Promise((resolve, reject) => {
    try {
      // Geçici bir yazdırma penceresi oluştur
      const printWindow = new BrowserWindow({
        width: 100,
        height: 100,
        show: false
      });

      // İçeriği yükle
      printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(content)}`);

      // İçerik yüklendiğinde yazdırma işlemini başlat
      printWindow.webContents.on('did-finish-load', async () => {
        try {
          // Termal yazıcıya özel yazdırma ayarları
          const options = {
            silent: true,
            printBackground: true,
            margins: { marginType: 'none' },
            deviceName: '', // Varsayılan yazıcı
            pageSize: { 
              width: Math.floor(settings.width * 1000) || 80000,  
              height: Math.floor(settings.height * 1000) || 150000
            }
          };

          // Yazdır
          await printWindow.webContents.print(options);
          
          setTimeout(() => {
            printWindow.close();
            resolve({ success: true, message: 'Yazdırma işlemi başarılı' });
          }, 1000);
        } catch (error) {
          printWindow.close();
          console.error('Yazdırma hatası:', error);
          resolve({ success: false, message: 'Yazdırma hatası: ' + error.message });
        }
      });

      // Hata olursa
      printWindow.webContents.on('did-fail-load', (error) => {
        printWindow.close();
        console.error('Sayfa yükleme hatası:', error);
        resolve({ success: false, message: 'Sayfa yükleme hatası' });
      });
    } catch (error) {
      console.error('Yazdırma hatası:', error);
      resolve({ success: false, message: 'Yazdırma işlemi başarısız: ' + error.message });
    }
  });
}); 