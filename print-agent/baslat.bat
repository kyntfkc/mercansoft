@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Bagimliliklar yukleniyor...
  call npm install
)
echo MercanSoft yazdirma servisi baslatiliyor...
node server.js
pause
