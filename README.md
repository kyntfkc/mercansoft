# MercanSoft Taş Hesaplama Uygulaması

## 📝 Proje Açıklaması

MercanSoft, takı modelleri için taş ağırlığı hesaplama ve takip sistemidir. Bu uygulama, kuyumcular, takı tasarımcıları ve üreticileri için tasarlanmıştır. 

## 💎 Özellikler

- **Model Bazlı Hesaplama:** Takı modellerini kaydedip, her modelde kullanılan taşların ağırlıklarını hesaplayın.
- **Görsel Desteği:** Modellere görsel ekleyerek takı tasarımlarınızı görüntüleyin.
- **Taş Yönetimi:** Kullandığınız tüm taşları ağırlıklarıyla birlikte kaydedin.
- **Taş Setleri:** Sık kullanılan taş kombinasyonlarını set olarak kaydedin ve hızlıca kullanın.
- **Veri Yedekleme:** Verilerinizi dışa ve içe aktararak yedekleyin veya farklı bilgisayarlara taşıyın.
- **Yerel Depolama:** Tüm veriler yerel olarak saklanır, internet bağlantısı gerektirmez.

## 🛠 Teknolojiler

- Next.js
- React
- Material UI
- Zustand (Durum Yönetimi)

## 🚀 Kurulum

Uygulamayı kurmak ve çalıştırmak için aşağıdaki adımları izleyin:

```bash
# Depoyu klonlayın
git clone https://github.com/kullanici/mercansoft.git

# Proje dizinine gidin
cd mercansoft

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

## 🔧 Kullanım

1. **Taşları Ekleyin:** Öncelikle "Taş Yönetimi" sekmesini kullanarak taşlarınızı ve ağırlıklarını ekleyin.
2. **Modelleri Oluşturun:** "Model Yönetimi" sekmesinde yeni modeller oluşturup, hangi taşlardan kaçar adet kullanıldığını belirtin.
3. **Hesaplamalar Yapın:** Ana sayfada modeli ve üretim adedini seçerek toplam taş ağırlığını hesaplayın.
4. **Veri Yedekleme:** "Ayarlar" sekmesinden verilerinizi yedekleyip geri yükleyebilirsiniz.

## 🌟 Katkıda Bulunma

1. Bu depoyu fork edin
2. Yeni bir özellik dalı oluşturun (`git checkout -b yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik: Açıklama'`)
4. Dalınıza push yapın (`git push origin yeni-ozellik`)
5. Bir Pull Request oluşturun

## 📄 Lisans

Bu proje MIT Lisansı ile lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

Sorularınız veya önerileriniz için: info@mercansoft.com

## Masaüstü Uygulaması (Electron)

Bu uygulama Electron.js ile masaüstü uygulaması olarak da çalıştırılabilir.

### Geliştirme Modunda Çalıştırma

```bash
npm run electron:dev
```

Bu komut, Next.js geliştirme sunucusunu ve Electron uygulamasını aynı anda başlatır.

### Masaüstü Uygulaması Oluşturma

```bash
npm run electron:build
```

Bu komut, uygulamanızı derleyecek ve işletim sisteminiz için bir masaüstü uygulaması oluşturacaktır. Oluşturulan uygulamalar `dist` klasöründe bulunabilir.

### Electron API Kullanımı

Electron API'lerine `window.electronAPI` üzerinden erişilebilir. Kullanılabilir metodlar:

- `ping()`: Test için ping-pong
- `getAppVersion()`: Uygulama sürümünü alma
- `saveFile(data, filename)`: Dosya kaydetme
- `openFile()`: Dosya açma
- `print()`: Yazdırma işlemi

Örnek kullanım:

```javascript
// Elektronik ortamda olup olmadığını kontrol etme
if (window.electronAPI) {
  const version = await window.electronAPI.getAppVersion();
  console.log('Uygulama sürümü:', version);
}
```
