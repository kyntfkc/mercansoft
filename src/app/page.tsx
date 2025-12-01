'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Fade, 
  Zoom, 
  Card,
  Avatar,
  Button,
  useTheme,
  Grid,
  Divider,
  CardContent,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MainCalculator from '../components/MainCalculator';
import StoneManager from '../components/StoneManager';
import ModelManager from '../components/ModelManager';
import SettingsManager from '../components/SettingsManager';
import CalculateIcon from '@mui/icons-material/Calculate';
import DiamondIcon from '@mui/icons-material/Diamond';
import LabelIcon from '@mui/icons-material/Label';
import SettingsIcon from '@mui/icons-material/Settings';
import BackupIcon from '@mui/icons-material/Backup';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InfoIcon from '@mui/icons-material/Info';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptIcon from '@mui/icons-material/Receipt';
import nextDynamic from 'next/dynamic';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { useRouter } from 'next/navigation';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';

// Electron test bileşenlerini client-side render'lamak için dynamic import kullanıyoruz
const ElectronVersionDisplay = nextDynamic(() => import('@/components/ElectronVersionDisplay'), { ssr: false });

// Özel Tab İçerik Komponenti
function TabContent({ active, children }: { active: boolean, children: React.ReactNode }) {
  return (
    <Fade in={active} timeout={450}>
      <Box sx={{ p: 2, display: active ? 'block' : 'none' }}>
        {children}
      </Box>
    </Fade>
  );
}

// Stillendirilmiş bileşenler
const StyledCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s ease',
  borderRadius: theme.spacing(1.5),
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  border: '1px solid #f0f0f0',
  overflow: 'hidden',
  height: '100%',
  cursor: 'pointer',
  '&:hover': {
    boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
    transform: 'translateY(-3px)'
  }
}));

export default function Home() {
  return (
    <Suspense fallback={<div />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const theme = useTheme();
  const router = useRouter();
  const { exportData, importData, resetStore, syncFromBackend, stones, models } = useStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [hasSynced, setHasSynced] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  // Client-side mount kontrolü
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isMounted, isAuthenticated, router]);

  // Company settings'ten logoyu yükle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('companySettings');
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          if (settings.logo) {
            setCompanyLogo(settings.logo);
            return;
          }
        } catch (error) {
          console.error('Company settings yüklenirken hata:', error);
        }
      }
      setCompanyLogo('/company-logo.svg');
    }
  }, []);

  // Uygulama açıldığında backend'den veri çek (sadece bir kez, client-side'da)
  useEffect(() => {
    if (isMounted && isAuthenticated && !hasSynced && typeof window !== 'undefined') {
      setHasSynced(true);
      // Her zaman backend'den veri çek (localStorage'daki eski verileri override et)
      syncFromBackend().catch(console.error);
    }
  }, [isMounted, isAuthenticated, hasSynced]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showMessage = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleLogout = () => {
    logout();
    resetStore();
    setHasSynced(false);
    router.replace('/login');
  };

  // URL'den gelen tab parametresini kontrol et
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(parseInt(tabParam));
    }
  }, [searchParams]);

  // Sayfa yüklendiğinde animasyon için
  useEffect(() => {
    setShowContent(true);
  }, []);

  // Tab bilgileri
  const tabs = [
    { label: 'Hesaplama', icon: <CalculateIcon /> },
    { label: 'Model Yönetimi', icon: <LabelIcon /> },
    { label: 'Taş Yönetimi', icon: <DiamondIcon /> },
    { label: 'Sistem Ayarları', icon: <SettingsIcon /> }
  ];

  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f7f8fa',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#f7f8fa', transform: 'scale(0.9)', transformOrigin: 'top center' }}>
      <Container maxWidth="xl" sx={{ py: 2.7, px: { xs: 1.8, md: 2.7 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2, gap: 1.5 }}>
          <Typography variant="body1" fontWeight={600} color="text.primary">
            {user ? `Hoş geldin, ${user.username}` : 'Hoş geldiniz'}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<LogoutIcon fontSize="small" />}
            onClick={handleLogout}
          >
            Çıkış Yap
          </Button>
        </Box>
      <Zoom in={showContent} timeout={600}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              mb: 3, 
              textAlign: 'center',
              background: 'linear-gradient(to right, #225C73, #5E8A9A)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(34, 92, 115, 0.3)',
              maxWidth: '350px',
              width: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              {companyLogo ? (
                <Box
                  component="img"
                  src={companyLogo}
                  alt="Firma Logosu"
                  sx={{
                    maxHeight: 56,
                    maxWidth: '100%',
                    objectFit: 'contain',
                    borderRadius: 3,
                    padding: 0.5,
                    filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.25))',
                    backgroundColor: 'rgba(255,255,255,0.08)'
                  }}
                />
              ) : (
                <>
                  <DiamondIcon sx={{ 
                    fontSize: 24, 
                    color: 'white', 
                    mr: 1,
                    filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.5))'
                  }} />
                  <Typography variant="h5" component="h1" fontWeight="bold">
                    MercanSoft
                  </Typography>
                </>
              )}
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Gelişmiş Taş Hesaplama Sistemi
            </Typography>
          </Paper>
        </Box>
      </Zoom>

      <Zoom in={showContent} timeout={900}>
        <Card elevation={3} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
          {/* Özel Tab Başlıkları */}
          <Box sx={{ 
            display: 'flex', 
            borderBottom: 1, 
            borderColor: 'divider',
            position: 'relative'
          }}>
            {/* Tab Indikatör - Aktif tab altındaki çizgi */}
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              left: `${(activeTab * 25)}%`,
              width: '25%',
              height: 3,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
              bgcolor: 'primary.main',
              background: 'linear-gradient(90deg, #225C73 0%, #5E8A9A 100%)',
              transition: 'left 0.3s ease-in-out',
              zIndex: 1
            }} />

            {tabs.map((tab, index) => (
              <Button
                key={index}
                onClick={() => setActiveTab(index)}
                sx={{
                  flex: 1,
                  borderRadius: 0,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  fontWeight: activeTab === index ? 600 : 500,
                  color: activeTab === index ? 'primary.main' : 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  '&:hover': {
                    bgcolor: 'rgba(153, 177, 191, 0.1)'
                  }
                }}
              >
                {React.cloneElement(tab.icon, { 
                  fontSize: 'small',
                  color: activeTab === index ? 'primary' : 'inherit'
                })}
                {tab.label}
              </Button>
            ))}
          </Box>

          {/* Tab İçerikleri */}
          <TabContent active={activeTab === 0}>
            <MainCalculator />
          </TabContent>
          <TabContent active={activeTab === 1}>
            <ModelManager />
          </TabContent>
          <TabContent active={activeTab === 2}>
            <StoneManager />
          </TabContent>
          <TabContent active={activeTab === 3}>
            {/* Sistem Ayarları */}
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  color: 'primary.main',
                  fontWeight: 500,
                  pb: 1,
                  borderBottom: '1px solid #eaeaea'
                }}
              >
                <SettingsIcon sx={{ mr: 1 }} fontSize="small" /> Sistem Ayarları
              </Typography>
              
              <Typography color="text.secondary" paragraph sx={{ mb: 3 }}>
                Sistem ayarlarını yapılandırabilir ve yönetebilirsiniz.
              </Typography>
              
              {/* Ayarlar Bölümü */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <StyledCard>
                    <Box sx={{ p: 2.5 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 1,
                        color: 'primary.main' 
                      }}>
                        <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight="medium">
                          Firma Ayarları
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Firma bilgilerini ve logoyu güncelle.
                      </Typography>
                      <Button
                        variant="outlined"
                        color="primary"
                        fullWidth
                        onClick={() => window.location.href = '/settings/company'}
                        sx={{ mt: 'auto' }}
                      >
                        Düzenle
                      </Button>
                    </Box>
                  </StyledCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <StyledCard>
                    <Box sx={{ p: 2.5 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 1,
                        color: 'primary.main' 
                      }}>
                        <ReceiptIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight="medium">
                          Fiş Tasarım Ayarları
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Fiş çıktı tasarımını özelleştirin
                      </Typography>
                      <Button
                        variant="outlined"
                        color="primary"
                        fullWidth
                        onClick={() => window.location.href = '/settings/receipt'}
                        sx={{ mt: 'auto' }}
                      >
                        Düzenle
                      </Button>
                    </Box>
                  </StyledCard>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <StyledCard>
                    <Box sx={{ p: 2.5 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 1,
                        color: 'primary.main' 
                      }}>
                        <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight="medium">
                          Genel Ayarlar
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Sistem genel ayarlarını yapılandırın
                      </Typography>
                      <Button
                        variant="outlined"
                        color="primary"
                        fullWidth
                        onClick={() => window.location.href = '/settings/general'}
                        sx={{ mt: 'auto' }}
                      >
                        Düzenle
                      </Button>
                    </Box>
                  </StyledCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <StyledCard>
                    <Box sx={{ p: 2.5 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 1,
                        color: 'primary.main' 
                      }}>
                        <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight="medium">
                          Kullanıcı Yönetimi
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Sistem kullanıcılarını yönetin
                      </Typography>
                      <Button
                        variant="outlined"
                        color="primary"
                        fullWidth
                        onClick={() => window.location.href = '/settings/users'}
                        sx={{ mt: 'auto' }}
                      >
                        Düzenle
                      </Button>
                    </Box>
                  </StyledCard>
                </Grid>
              </Grid>

              {/* Veri Yönetimi Başlığı */}
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  color: 'primary.main',
                  fontWeight: 500,
                  pb: 1,
                  borderBottom: '1px solid #eaeaea'
                }}
              >
                <BackupIcon sx={{ mr: 1 }} fontSize="small" /> Veri Yönetimi
              </Typography>
              
              <Typography color="text.secondary" paragraph sx={{ mb: 3 }}>
                Verilerinizi yedekleyebilir, içe aktarabilir veya sıfırlayabilirsiniz.
              </Typography>

              {/* Veri Yönetimi Kartları */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <StyledCard>
                    <Box sx={{ p: 2.5 }}>
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
                        fullWidth
                        onClick={() => {
                          if (window.electronAPI) {
                            const appData = JSON.parse(exportData()); // Store'dan verileri al
                            window.electronAPI.saveFile(appData, 'mercansoft-veriler.json')
                              .then(result => {
                                if (result.success) {
                                  showMessage('Veriler başarıyla dışa aktarıldı', 'success');
                                } else {
                                  showMessage(result.message, 'error');
                                }
                              })
                              .catch(error => {
                                showMessage('Dışa aktarma sırasında bir hata oluştu: ' + error, 'error');
                              });
                          } else {
                            showMessage('Bu özellik sadece masaüstü uygulamasında kullanılabilir', 'warning');
                          }
                        }}
                        sx={{ mt: 'auto' }}
                      >
                        Dışa Aktar
                      </Button>
                    </Box>
                  </StyledCard>
                </Grid>

                <Grid item xs={12} md={4}>
                  <StyledCard>
                    <Box sx={{ p: 2.5 }}>
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
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<UploadFileIcon />}
                        fullWidth
                        onClick={() => {
                          if (window.electronAPI) {
                            window.electronAPI.openFile()
                              .then(result => {
                                if (result.success && result.data) {
                                  try {
                                    importData(JSON.stringify(result.data));
                                    showMessage('Veriler başarıyla içe aktarıldı', 'success');
                                  } catch (error) {
                                    showMessage('Veri formatı uygun değil: ' + error, 'error');
                                  }
                                } else {
                                  showMessage(result.message, 'error');
                                }
                              })
                              .catch(error => {
                                showMessage('İçe aktarma sırasında bir hata oluştu: ' + error, 'error');
                              });
                          } else {
                            showMessage('Bu özellik sadece masaüstü uygulamasında kullanılabilir', 'warning');
                          }
                        }}
                        sx={{ mt: 'auto' }}
                      >
                        İçe Aktar
                      </Button>
                    </Box>
                  </StyledCard>
                </Grid>

                <Grid item xs={12} md={4}>
                  <StyledCard>
                    <Box sx={{ p: 2.5 }}>
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
                        fullWidth
                        sx={{ mt: 'auto' }}
                        onClick={() => {
                          if (window.confirm('Tüm verileri sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
                            resetStore();
                            showMessage('Tüm veriler başarıyla sıfırlandı', 'success');
                          }
                        }}
                      >
                        Tüm Verileri Sıfırla
                      </Button>
                    </Box>
                  </StyledCard>
                </Grid>
              </Grid>

              {/* Uygulama Bilgisi */}
              <Box sx={{ mt: 4 }}>
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
                    
                    <ElectronVersionDisplay />
                    
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      © {new Date().getFullYear()} MercanSoft - Tüm hakları saklıdır.
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </TabContent>
        </Card>
      </Zoom>
      
      <Zoom in={showContent} timeout={1200}>
        <Paper 
          elevation={2}
          sx={{ 
            p: 2, 
            textAlign: 'center', 
            borderRadius: 2,
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
            maxWidth: '450px',
            mx: 'auto'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <DiamondIcon sx={{ fontSize: 16, color: theme.palette.primary.light, mr: 1 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              © {new Date().getFullYear()} MercanSoft
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
            İndigo Takı Elektronik Tic. Ltd. Şti.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
            Tüm hakları saklıdır. Takı modelleri için taş hesaplama çözümü.
          </Typography>
        </Paper>
      </Zoom>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            minWidth: '250px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '& .MuiAlert-icon': {
              fontSize: '24px'
            },
            '& .MuiAlert-message': {
              fontSize: '0.95rem',
              fontWeight: 500
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Container>
    </Box>
  );
}
