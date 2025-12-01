#!/bin/bash
# Railway'de migration script'ini çalıştır

echo "📂 Migration başlatılıyor..."

# Dosyayı stdin'den oku
cat > /tmp/mercansoft-veriler.json

# Migration script'ini çalıştır
node migrate-local-data.js /tmp/mercansoft-veriler.json

echo "✅ Migration tamamlandı!"

