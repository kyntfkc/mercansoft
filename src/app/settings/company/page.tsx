'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  Avatar,
  Divider,
  Paper,
  CircularProgress,
  Fade
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { companySettingsAPI } from '@/lib/api';

export default function CompanySettings() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState({
    companyName: 'MercanSoft',
    legalName: 'İndigo Takı Elektronik Tic. Ltd. Şti.',
    taxOffice: '',
    taxNumber: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '/company-logo.svg' as string | null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Sayfa yüklendiğinde backend'den ayarları al
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const backendSettings = await companySettingsAPI.get();
        setSettings({
          companyName: backendSettings.companyName || 'MercanSoft',
          legalName: backendSettings.legalName || '',
          taxOffice: backendSettings.taxOffice || '',
          taxNumber: backendSettings.taxNumber || '',
          address: backendSettings.address || '',
          phone: backendSettings.phone || '',
          email: backendSettings.email || '',
          website: backendSettings.website || '',
          logo: backendSettings.logo || '/company-logo.svg',
        });
      } catch (error) {
        console.error('Backend\'den ayarlar yüklenirken hata:', error);
        // Fallback: localStorage'dan yükle
        if (typeof window !== 'undefined') {
          const savedSettings = localStorage.getItem('companySettings');
          if (savedSettings) {
            try {
              setSettings(JSON.parse(savedSettings));
            } catch (e) {
              console.error('LocalStorage\'dan ayarlar yüklenirken hata:', e);
            }
          }
        }
      }
    };
    loadSettings();
  }, []);

  const handleChange = (field: string) => (event: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setIsUploading(true);
      
      // Resim boyutunu kontrol et
      if (file.size > 1024 * 1024) {
        // 1MB'dan büyük dosyaları uyar
        if (!window.confirm('Dosya boyutu büyük (1MB üzeri). Büyük logolar kaydedilemeyebilir. Devam etmek istiyor musunuz?')) {
          setIsUploading(false);
          return;
        }
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        // Resmi canvas'a çizerek boyutunu küçült
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Maksimum boyutları 400px olarak sınırla
          const MAX_SIZE = 400;
          if (width > height && width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Sıkıştırılmış resmi al
          const resizedImage = canvas.toDataURL('image/jpeg', 0.7);
          
          setSettings(prev => ({
            ...prev,
            logo: resizedImage
          }));
          setIsUploading(false);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      alert('Lütfen geçerli bir resim dosyası yükleyin (JPEG, PNG, GIF vb.)');
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({
      ...prev,
      logo: null
    }));
  };

  const handleSave = async () => {
    try {
      // Backend'e kaydet
      await companySettingsAPI.update({
        companyName: settings.companyName,
        legalName: settings.legalName,
        taxOffice: settings.taxOffice,
        taxNumber: settings.taxNumber,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        logo: settings.logo,
      });
      
      // LocalStorage'a da kaydet (fallback için)
      if (typeof window !== 'undefined') {
        localStorage.setItem('companySettings', JSON.stringify(settings));
      }
      
      alert('Firma ayarları kaydedildi!');
    } catch (error: any) {
      console.error('Kaydetme hatası:', error);
      alert(error.message || 'Ayarlar kaydedilirken bir hata oluştu.');
    }
  };

  // Sürükle bırak işleyicileri
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
      e.dataTransfer.clearData();
    }
  }, []);

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => router.push('/?tab=3')} 
          color="primary" 
          sx={{ mr: 1 }}
          aria-label="geri dön"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5">
          Firma Ayarları
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Firma Bilgileri
              </Typography>
              
              <TextField
                fullWidth
                label="Firma Adı"
                value={settings.companyName}
                onChange={handleChange('companyName')}
                margin="normal"
              />

              <TextField
                fullWidth
                label="Yasal Ünvan"
                value={settings.legalName}
                onChange={handleChange('legalName')}
                margin="normal"
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vergi Dairesi"
                    value={settings.taxOffice}
                    onChange={handleChange('taxOffice')}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Vergi Numarası"
                    value={settings.taxNumber}
                    onChange={handleChange('taxNumber')}
                    margin="normal"
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Adres"
                value={settings.address}
                onChange={handleChange('address')}
                margin="normal"
                multiline
                rows={3}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Telefon"
                    value={settings.phone}
                    onChange={handleChange('phone')}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="E-posta"
                    value={settings.email}
                    onChange={handleChange('email')}
                    margin="normal"
                    type="email"
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Web Sitesi"
                value={settings.website}
                onChange={handleChange('website')}
                margin="normal"
              />

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  fullWidth
                >
                  Kaydet
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Firma Logosu
              </Typography>
              
              <Box
                sx={{
                  width: '100%',
                  height: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed',
                  borderColor: isDragging ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  mb: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  bgcolor: isDragging ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
                  '&:hover': {
                    borderColor: 'primary.light',
                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {settings.logo ? (
                  <>
                    <Avatar
                      src={settings.logo}
                      variant="square"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveLogo();
                      }}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'background.paper',
                        '&:hover': {
                          bgcolor: 'error.light',
                          color: 'white'
                        }
                      }}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                ) : isUploading ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress size={40} sx={{ mb: 1 }} />
                    <Typography color="text.secondary">
                      Yükleniyor...
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <CloudUploadIcon sx={{ fontSize: 48, color: isDragging ? 'primary.main' : 'text.secondary', mb: 1 }} />
                    <Typography color={isDragging ? 'primary.main' : 'text.secondary'}>
                      {isDragging ? 'Dosyayı bırakın' : 'Logo yüklemek için tıklayın'}
                    </Typography>
                    <Typography color="text.secondary" variant="caption" sx={{ mt: 1, display: 'block' }}>
                      veya dosyayı sürükleyip buraya bırakın
                    </Typography>
                  </Box>
                )}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                />
              </Box>
              
              <Button
                variant="outlined"
                fullWidth
                startIcon={<FileUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                Logo Seç
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 