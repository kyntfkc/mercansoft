'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Paper,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LanguageIcon from '@mui/icons-material/Language';
import AccessTimeIcon from '@mui/icons-material/AccessTime'; 
import NumbersIcon from '@mui/icons-material/Numbers';
import NotificationsIcon from '@mui/icons-material/Notifications';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease',
  borderRadius: theme.spacing(1.5),
  boxShadow: '0 6px 10px rgba(0,0,0,0.08)',
  '&:hover': {
    boxShadow: theme.shadows[8]
  }
}));

export default function GeneralSettings() {
  const router = useRouter();
  const initialSettings = {
    language: 'tr',
    theme: 'light',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24',
    decimalSeparator: ',',
    thousandSeparator: '.',
    autoSave: true,
    notifications: true,
    soundEffects: true,
  };
  
  const [settings, setSettings] = useState(initialSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // Ayarları yükle
  useEffect(() => {
    const savedSettings = localStorage.getItem('generalSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Ayarlar yüklenirken hata:', error);
      }
    }
  }, []);

  // Değişiklikleri takip et
  useEffect(() => {
    const savedSettings = localStorage.getItem('generalSettings');
    if (savedSettings) {
      try {
        setHasChanges(JSON.stringify(settings) !== savedSettings);
      } catch (error) {
        setHasChanges(true);
      }
    }
  }, [settings]);

  const handleChange = (field: string) => (event: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleToggle = (field: string) => (event: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem('generalSettings', JSON.stringify(settings));
      setHasChanges(false);
      alert('Ayarlar kaydedildi!');
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      alert('Ayarlar kaydedilirken bir hata oluştu!');
    }
  };

  const handleReset = () => {
    if (window.confirm('Tüm ayarları varsayılana döndürmek istediğinize emin misiniz?')) {
      setSettings(initialSettings);
      setHasChanges(true);
    }
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={() => router.push('/?tab=3')} 
            color="primary" 
            sx={{ mr: 1 }}
            aria-label="geri dön"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' }, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsSuggestIcon fontSize="medium" />
            Gelişmiş Ayarlar
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={8} lg={6} sx={{ mx: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
            {/* Dil ve Görünüm */}
            <StyledCard>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontSize: { xs: '1rem', sm: '1.1rem' }, 
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  borderBottom: '1px solid #f0f0f0',
                  pb: 1,
                  mb: 2
                }}>
                  <LanguageIcon fontSize="small" /> Dil ve Görünüm
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Dil</InputLabel>
                    <Select
                      value={settings.language}
                      onChange={handleChange('language')}
                      label="Dil"
                    >
                      <MenuItem value="tr">Türkçe</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Tema</InputLabel>
                    <Select
                      value={settings.theme}
                      onChange={handleChange('theme')}
                      label="Tema"
                    >
                      <MenuItem value="light">Açık</MenuItem>
                      <MenuItem value="dark">Koyu</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </StyledCard>

            {/* Tarih ve Saat */}
            <StyledCard>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontSize: { xs: '1rem', sm: '1.1rem' }, 
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  borderBottom: '1px solid #f0f0f0',
                  pb: 1,
                  mb: 2
                }}>
                  <AccessTimeIcon fontSize="small" /> Tarih ve Saat
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Tarih Formatı</InputLabel>
                    <Select
                      value={settings.dateFormat}
                      onChange={handleChange('dateFormat')}
                      label="Tarih Formatı"
                    >
                      <MenuItem value="DD.MM.YYYY">GG.AA.YYYY</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-AA-GG</MenuItem>
                      <MenuItem value="DD/MM/YYYY">GG/AA/YYYY</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Saat Formatı</InputLabel>
                    <Select
                      value={settings.timeFormat}
                      onChange={handleChange('timeFormat')}
                      label="Saat Formatı"
                    >
                      <MenuItem value="24">24 Saat</MenuItem>
                      <MenuItem value="12">12 Saat</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </StyledCard>

            {/* Sayı Formatı */}
            <StyledCard>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontSize: { xs: '1rem', sm: '1.1rem' }, 
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  borderBottom: '1px solid #f0f0f0',
                  pb: 1,
                  mb: 2
                }}>
                  <NumbersIcon fontSize="small" /> Sayı Formatı
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Ondalık Ayracı</InputLabel>
                    <Select
                      value={settings.decimalSeparator}
                      onChange={handleChange('decimalSeparator')}
                      label="Ondalık Ayracı"
                    >
                      <MenuItem value=",">Virgül (,)</MenuItem>
                      <MenuItem value=".">Nokta (.)</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel>Binlik Ayracı</InputLabel>
                    <Select
                      value={settings.thousandSeparator}
                      onChange={handleChange('thousandSeparator')}
                      label="Binlik Ayracı"
                    >
                      <MenuItem value=".">Nokta (.)</MenuItem>
                      <MenuItem value=",">Virgül (,)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </StyledCard>

            {/* Bildirimler */}
            <StyledCard>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  fontSize: { xs: '1rem', sm: '1.1rem' }, 
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  borderBottom: '1px solid #f0f0f0',
                  pb: 1,
                  mb: 2
                }}>
                  <NotificationsIcon fontSize="small" /> Bildirimler
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoSave}
                        onChange={handleToggle('autoSave')}
                        size="small"
                        color="primary"
                      />
                    }
                    label={<Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Otomatik Kaydet</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications}
                        onChange={handleToggle('notifications')}
                        size="small"
                        color="primary"
                      />
                    }
                    label={<Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Bildirimler</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.soundEffects}
                        onChange={handleToggle('soundEffects')}
                        size="small"
                        color="primary"
                      />
                    }
                    label={<Typography sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Ses Efektleri</Typography>}
                  />
                </Box>
              </CardContent>
            </StyledCard>

            {/* Butonlar */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 1 }}>
              <Button
                variant="text"
                startIcon={<RestartAltIcon />}
                onClick={handleReset}
                size="small"
                color="error"
                sx={{ fontSize: '0.85rem' }}
              >
                Varsayılana Sıfırla
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                size="medium"
                sx={{ 
                  minWidth: 120,
                  bgcolor: hasChanges ? 'primary.main' : 'grey.400',
                  '&:hover': {
                    bgcolor: hasChanges ? 'primary.dark' : 'grey.500'
                  }
                }}
                disabled={!hasChanges}
              >
                Kaydet
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
} 