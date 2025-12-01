'use client';

import React from 'react';
import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Divider,
  Alert,
  Snackbar,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  IconButton,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useStore } from '../store/useStore';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SaveIcon from '@mui/icons-material/Save';
import InfoIcon from '@mui/icons-material/Info';
import BackupIcon from '@mui/icons-material/Backup';
import { useRouter } from 'next/navigation';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SettingsIcon from '@mui/icons-material/Settings';
import PrintIcon from '@mui/icons-material/Print';
import BusinessIcon from '@mui/icons-material/Business';

// Stillendirilmiş bileşenler
const StyledCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s ease',
  borderRadius: theme.spacing(1.5),
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  border: '1px solid #f0f0f0',
  overflow: 'hidden',
  height: '100%',
  '&:hover': {
    boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
    transform: 'translateY(-3px)'
  }
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  margin: '4px 0',
  '&:hover': {
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
  }
}));

export default function SettingsManager() {
  const { exportData, importData, resetStore } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleExport = () => {
    const dataStr = exportData();
    
    // Dosya adı oluştur
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `mercansoft-yedek-${date}.json`;
    
    // Dosyayı oluştur ve indir
    const blob = new Blob([dataStr], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
    
    setSuccessMessage('Veriler başarıyla dışa aktarıldı');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // JSON formatını kontrol et
        JSON.parse(content);
        importData(content);
        setSuccessMessage('Veriler başarıyla içe aktarıldı');
      } catch (error) {
        console.error('İçe aktarma hatası:', error);
        setImportError('Geçersiz dosya formatı. Lütfen geçerli bir yedek dosyası seçin.');
      }
    };
    
    reader.readAsText(file);
    
    // Dosya girişini sıfırla (aynı dosyayı tekrar seçebilmek için)
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleReset = () => {
    if (window.confirm('Tüm verileri sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
      resetStore();
      setSuccessMessage('Tüm veriler başarıyla sıfırlandı');
    }
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
    setImportError(null);
  };

  const menuItems = [
    {
      title: 'Firma Ayarları',
      icon: <BusinessIcon color="primary" />,
      description: 'Firma bilgilerini ve logosunu yönetin',
      path: '/settings/company'
    },
    {
      title: 'Fiş Tasarım Ayarları',
      icon: <ReceiptIcon color="primary" />,
      description: 'Fiş çıktı tasarımını özelleştirin',
      path: '/settings/receipt'
    },
    {
      title: 'Genel Ayarlar',
      icon: <SettingsIcon color="primary" />,
      description: 'Sistem genel ayarlarını yapılandırın',
      path: '/settings/general'
    }
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Typography 
        variant="h5" 
        component="h1" 
        sx={{ 
          mb: 3, 
          display: 'flex', 
          alignItems: 'center', 
          fontWeight: 500,
          color: 'primary.main'
        }}
      >
        <SettingsIcon sx={{ mr: 1 }} /> Sistem Ayarları
      </Typography>
      
      {/* Ayar Menüleri */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {menuItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <StyledCard onClick={() => router.push(item.path)}>
              <CardContent sx={{ 
                p: 2.5, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                cursor: 'pointer' 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Box 
                    sx={{ 
                      p: 1, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.light', 
                      color: 'white',
                      display: 'flex',
                      mr: 1.5
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="h6" fontWeight="500">
                    {item.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                  {item.description}
                </Typography>
              </CardContent>
            </StyledCard>
          </Grid>
        ))}
      </Grid>

      {/* Veri Yönetimi Bölümü */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center',
            color: 'text.primary',
            fontWeight: 500,
            pb: 1,
            borderBottom: '1px solid #eaeaea'
          }}
        >
          <BackupIcon sx={{ mr: 1 }} fontSize="small" /> Veri Yönetimi
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <StyledCard>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1,
                  color: 'primary.main' 
                }}>
                  <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="medium">
                    Verileri Dışa Aktar
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Tüm taş, model ve set verilerinizi bir JSON dosyasına aktarın.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                  fullWidth
                  sx={{ mt: 'auto' }}
                >
                  Dışa Aktar
                </Button>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <StyledCard>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1,
                  color: 'secondary.main' 
                }}>
                  <UploadFileIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="medium">
                    Verileri İçe Aktar
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Daha önce dışa aktardığınız veri dosyasını geri yükleyin.
                </Typography>
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleImportFile}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<UploadFileIcon />}
                  onClick={handleImportClick}
                  fullWidth
                  sx={{ mt: 'auto' }}
                >
                  İçe Aktar
                </Button>
              </CardContent>
            </StyledCard>
          </Grid>

          <Grid item xs={12} md={4}>
            <StyledCard>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1,
                  color: 'error.main' 
                }}>
                  <DeleteForeverIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="medium">
                    Verileri Sıfırla
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Tüm kayıtlı verilerinizi kalıcı olarak silin. Bu işlem geri alınamaz!
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteForeverIcon />}
                  onClick={handleReset}
                  fullWidth
                  sx={{ mt: 'auto' }}
                >
                  Tüm Verileri Sıfırla
                </Button>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </Box>

      {/* Uygulama Bilgisi */}
      <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#f9f9f9' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 1 
          }}>
            <InfoIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="subtitle1" fontWeight="medium">
              Uygulama Hakkında
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" paragraph>
            MercanSoft Taş Hesaplama Uygulaması, takı modellerindeki taşların ağırlıklarını hesaplamak için tasarlanmış özel bir uygulamadır.
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            Versiyon: 1.0.0
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            © {new Date().getFullYear()} MercanSoft - Tüm hakları saklıdır.
          </Typography>
        </CardContent>
      </Card>

      {/* Bildirim Snackbar */}
      <Snackbar
        open={!!successMessage || !!importError}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={successMessage ? "success" : "error"} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage || importError}
        </Alert>
      </Snackbar>
    </Box>
  );
} 