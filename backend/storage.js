const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Railway Storage veya local storage için helper
class ImageStorage {
  constructor() {
    // Railway'de persistent volume mount path
    // Local'de uploads klasörü
    this.storagePath = process.env.STORAGE_PATH || path.join(__dirname, 'uploads');
    
    // Base URL: Railway domain veya local
    const railwayUrl = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL;
    if (railwayUrl) {
      this.baseUrl = `https://${railwayUrl}/uploads`;
    } else {
      this.baseUrl = process.env.STORAGE_BASE_URL || process.env.API_URL ? `${process.env.API_URL}/uploads` : '/uploads';
    }
    
    // Storage klasörünü oluştur
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  // Base64 görseli dosyaya kaydet
  async saveBase64Image(base64Data, modelId) {
    try {
      // Base64 formatını parse et
      const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Geçersiz base64 formatı');
      }

      const imageType = matches[1]; // png, jpeg, etc.
      const imageData = matches[2];
      
      // Dosya adı oluştur
      const fileName = `${modelId}-${crypto.randomBytes(8).toString('hex')}.${imageType}`;
      const filePath = path.join(this.storagePath, fileName);
      
      // Base64'ü binary'ye çevir ve kaydet
      const buffer = Buffer.from(imageData, 'base64');
      fs.writeFileSync(filePath, buffer);
      
      // URL döndür
      return `${this.baseUrl}/${fileName}`;
    } catch (error) {
      console.error('Görsel kaydetme hatası:', error);
      throw error;
    }
  }

  // Dosyayı sil
  async deleteImage(imageUrl) {
    try {
      if (!imageUrl || !imageUrl.startsWith(this.baseUrl)) {
        return; // Base64 veya external URL ise silme
      }

      const fileName = path.basename(imageUrl);
      const filePath = path.join(this.storagePath, fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Görsel silme hatası:', error);
      // Hata olsa bile devam et
    }
  }

  // Base64 mü yoksa URL mi kontrol et
  isBase64(str) {
    if (!str) return false;
    return str.startsWith('data:image/');
  }
}

module.exports = new ImageStorage();

