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
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Divider,
  Slider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PreviewIcon from '@mui/icons-material/Preview';
import { styled } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import PrintIcon from '@mui/icons-material/Print';
import ColorizeIcon from '@mui/icons-material/Colorize';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { companySettingsAPI, receiptSettingsAPI } from '@/lib/api';
import {
  buildReceiptHtml,
  defaultReceiptSettings,
  mergeReceiptSettings,
  openPrintWindow,
  ReceiptSettings as ReceiptSettingsType,
} from '@/lib/receipt';
import { resolveLogoUrl } from '@/lib/logo';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'none',
  borderRadius: theme.spacing(1),
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  }
}));

const SettingHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <Box 
    sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      mb: 1.5, 
      pb: 1,
      borderBottom: '1px solid #f0f0f0'
    }}
  >
    {icon}
    <Typography 
      variant="subtitle1" 
      color="primary.main" 
      sx={{ 
        fontSize: '0.9rem', 
        fontWeight: 600,
        ml: 1 
      }}
    >
      {title}
    </Typography>
  </Box>
);

const SettingGroup = ({ title, tooltip, children }: { 
  title: string; 
  tooltip?: string;
  children: React.ReactNode;
}) => (
  <Box sx={{ mb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
      <Typography variant="body2" fontWeight={600} color="text.secondary">
        {title}
      </Typography>
      {tooltip && (
        <Tooltip title={tooltip} arrow>
          <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
            <InfoIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
    <Box sx={{ pl: 0.5 }}>
      {children}
    </Box>
  </Box>
);

// Bölge ayarlarına bağlı olmayan tarih formatı
const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

// Bölge ayarlarına bağlı olmayan saat formatı
const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function ReceiptSettings() {
  const router = useRouter();
  const initialSettings = defaultReceiptSettings();

  const [settings, setSettings] = useState<ReceiptSettingsType>(initialSettings);
  const [savedSettings, setSavedSettings] = useState<ReceiptSettingsType>(initialSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [loadedSettings, company] = await Promise.all([
          receiptSettingsAPI.get(),
          companySettingsAPI.get().catch(() => null),
        ]);
        const merged = mergeReceiptSettings(loadedSettings);
        setSettings(merged);
        setSavedSettings(merged);
        setCompanyLogo(company?.logo || null);
      } catch (error) {
        console.error('Fiş ayarları yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(savedSettings));
  }, [settings, savedSettings]);

  const handleChange = (field: string) => (event: any) => {
    if (field.startsWith('margins.')) {
      const margin = field.split('.')[1];
      setSettings(prev => ({
        ...prev,
        margins: {
          ...prev.margins,
          [margin]: Number(event.target.value)
        }
      }));
    } else {
      const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
      setSettings(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSliderChange = (field: string) => (event: Event, value: number | number[]) => {
    setSettings(prev => ({
      ...prev,
      [field]: typeof value === 'number' ? value : value[0]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const saved = await receiptSettingsAPI.update(settings);
      setSettings(saved);
      setSavedSettings(saved);
      setHasChanges(false);
      alert('Fiş tasarım ayarları başarıyla kaydedildi!');
    } catch (error: any) {
      console.error('Ayarlar kaydedilirken hata oluştu:', error);
      alert(`Ayarlar kaydedilirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    try {
      const html = buildReceiptHtml(
        settings,
        {
          modelName: settings.modelName?.trim() || 'Örnek Model',
          productionCount: 2,
          totalWeight: 1.5,
          stoneDetails: [
            { stoneName: 'Zirkon 1.5mm', quantity: 24, totalWeight: 0.96 },
            { stoneName: 'Baget 2mm', quantity: 8, totalWeight: 0.54 },
          ],
          printedAt: new Date(),
        },
        companyLogo
      );
      openPrintWindow(html);
    } catch (error: any) {
      alert(error?.message || 'Yazdırma sırasında bir hata oluştu');
    }
  };

  const handleReset = () => {
    if (window.confirm('Tüm ayarları sıfırlamak istediğinize emin misiniz?')) {
      setSettings(defaultReceiptSettings());
      setHasChanges(true);
    }
  };

  const ReceiptPreview = () => {
    const previewData = {
      total: { quantity: 2, weight: 1.5 },
      stones: [
        { stoneName: 'Zirkon 1.5mm', quantity: 24, totalWeight: 0.96 },
        { stoneName: 'Baget 2mm', quantity: 8, totalWeight: 0.54 },
      ],
    };
    const now = new Date();
    const logoSrc = companyLogo ? resolveLogoUrl(companyLogo) : null;

    return (
      <Paper 
        sx={{ 
          p: 1,
          width: settings.width * 3.779527559,
          height: 'auto',
          minHeight: settings.minHeight * 3.779527559,
          mx: 'auto',
          fontFamily: settings.fontFamily,
          fontSize: settings.fontSize,
          lineHeight: settings.lineHeight,
          bgcolor: '#fbfbfb',
          transition: 'none'
        }}
      >
        <Box 
          sx={{ 
            textAlign: settings.titleCenter ? 'center' : 'left',
            border: '2px solid #ccdbe3',
            borderRadius: '5px',
            p: 1,
            bgcolor: 'white',
            boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
            position: 'relative',
          }}
        >
          {settings.showLogo && logoSrc && (
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
              <Box
                component="img"
                src={logoSrc}
                alt="Logo"
                sx={{
                  height: Math.max(24, Math.round((settings.logoSize / 100) * 48)),
                  maxWidth: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>
          )}

          {settings.showTitle && (
            <Typography 
              sx={{
                textAlign: settings.titleCenter ? 'center' : 'left',
                mb: 0.5,
                fontSize: settings.titleSize,
                color: settings.titleColor || '#225C73',
                borderBottom: '1px dashed #dde9ef',
                pb: 0.5,
                fontWeight: settings.titleBold ? 'bold' : 'normal'
              }}
            >
              {settings.title}
            </Typography>
          )}

          {(settings.showDate || settings.showTime) && (
            <Typography sx={{ fontSize: Math.max(8, settings.fontSize - 1), color: '#666', mb: 0.75 }}>
              {settings.showDate ? formatDate(now) : ''}
              {settings.showDate && settings.showTime ? ' ' : ''}
              {settings.showTime ? formatTime(now) : ''}
            </Typography>
          )}
          
          {settings.showModel && (
            <Typography
              sx={{
                fontSize: settings.fontSize + 1,
                my: 0.75,
                bgcolor: '#f3f8fb',
                p: 0.5,
                borderRadius: '3px',
                border: '1px solid #e0ebf2'
              }}
            >
              {settings.modelName?.trim() || 'Örnek Model'}
            </Typography>
          )}
          
          <Box 
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              my: 0.75,
              p: 0.5,
              borderRadius: '3px',
              bgcolor: '#f8fbfc',
              gap: 0.5
            }}
          >
            {settings.showQuantity && (
            <Box 
              sx={{
                textAlign: 'center',
                flex: 1,
                p: 0.5,
                borderRadius: '3px'
              }}
            >
              <Typography 
                sx={{
                  fontSize: settings.fontSize + 4,
                  fontWeight: 'bold',
                  mb: 0.25,
                  color: '#225C73'
                }}
              >
                {previewData.total.quantity}
              </Typography>
              <Typography 
                sx={{
                  fontSize: settings.fontSize - 3,
                  color: '#666',
                  textTransform: 'uppercase'
                }}
              >
                ADET
              </Typography>
            </Box>
            )}
            
            <Box 
              sx={{
                textAlign: 'center',
                flex: 1,
                p: 0.5,
                borderRadius: '3px'
              }}
            >
              <Typography 
                sx={{
                  fontSize: settings.fontSize + 4,
                  fontWeight: 'bold',
                  mb: 0.25,
                  color: '#225C73'
                }}
              >
                {previewData.total.weight}
              </Typography>
              <Typography 
                sx={{
                  fontSize: settings.fontSize - 3,
                  color: '#666',
                  textTransform: 'uppercase'
                }}
              >
                TAŞ GRAMI
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 1, pt: 0.75, borderTop: '1px dotted #dde9ef', textAlign: 'left' }}>
            <Typography
              sx={{
                fontSize: Math.max(8, settings.fontSize - 1),
                fontWeight: settings.tableHeaderBold ? 'bold' : 'normal',
                color: '#666',
                textTransform: 'uppercase',
                mb: 0.5,
              }}
            >
              Taş Detayları
            </Typography>
            {previewData.stones.map((stone) => (
              <Box key={stone.stoneName} sx={{ py: 0.4 }}>
                <Typography sx={{ fontSize: settings.fontSize, fontWeight: 500, mb: 0.15 }}>
                  {stone.stoneName}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                  <Typography sx={{ fontSize: Math.max(8, settings.fontSize - 1), color: '#555' }}>
                    {stone.quantity} adet
                  </Typography>
                  <Typography sx={{ fontSize: Math.max(8, settings.fontSize - 1), color: '#555' }}>
                    {stone.totalWeight.toFixed(3)} gr
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
          
          {settings.showFooter && (
            <Typography 
              sx={{ 
                mt: 0.75,
                fontSize: settings.footerFontSize,
                color: '#225C73',
                textAlign: 'center',
                borderTop: '1px dashed #dde9ef',
                pt: 0.5,
                fontWeight: 500
              }}
            >
              {settings.footerText}
            </Typography>
          )}
        </Box>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Fiş ayarları yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton 
          onClick={() => router.replace('/?tab=3')} 
          color="primary" 
          size="small"
          sx={{ mr: 1 }}
          aria-label="geri dön"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.2rem' } }}>
          Fiş Tasarım Ayarları
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <StyledCard>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <SettingHeader 
                  icon={<ColorizeIcon fontSize="small" color="primary" />} 
                  title="Fiş Görünüm Ayarları" 
                />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <SettingGroup title="İçerik Görünümü">
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        <FormControlLabel
                          control={<Switch checked={settings.showTitle} onChange={handleChange('showTitle')} size="small" color="primary" />}
                          label={<Typography variant="body2">Başlık</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch checked={settings.showLogo} onChange={handleChange('showLogo')} size="small" color="primary" />}
                          label={<Typography variant="body2">Logo</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch checked={settings.showDate} onChange={handleChange('showDate')} size="small" color="primary" />}
                          label={<Typography variant="body2">Tarih</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch checked={settings.showTime} onChange={handleChange('showTime')} size="small" color="primary" />}
                          label={<Typography variant="body2">Saat</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch checked={settings.showModel} onChange={handleChange('showModel')} size="small" color="primary" />}
                          label={<Typography variant="body2">Model</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch checked={settings.showQuantity} onChange={handleChange('showQuantity')} size="small" color="primary" />}
                          label={<Typography variant="body2">Adet</Typography>}
                        />
                        <FormControlLabel
                          control={<Switch checked={settings.showFooter} onChange={handleChange('showFooter')} size="small" color="primary" />}
                          label={<Typography variant="body2">Alt Bilgi</Typography>}
                        />
                      </Box>
                    </SettingGroup>

                    {settings.showTitle && (
                      <SettingGroup title="Başlık Detayları">
                        <TextField
                          fullWidth
                          label="Başlık Metni"
                          placeholder="Örn: MercanSoft"
                          value={settings.title}
                          onChange={handleChange('title')}
                          size="small"
                          margin="dense"
                          sx={{ mb: 1 }}
                        />
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <FormControlLabel
                            control={<Switch checked={settings.titleBold} onChange={handleChange('titleBold')} size="small" />}
                            label={<Typography variant="body2">Kalın</Typography>}
                          />
                          <Tooltip title="Başlık boyutu">
                            <Box sx={{ width: 100 }}>
                              <Slider 
                                value={settings.titleSize} 
                                onChange={handleSliderChange('titleSize')} 
                                min={12} max={20} 
                                step={1} 
                                size="small"
                                valueLabelDisplay="auto"
                              />
                            </Box>
                          </Tooltip>
                        </Box>
                      </SettingGroup>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    {settings.showModel && (
                      <SettingGroup title="Model Bilgisi">
                        <TextField
                          fullWidth
                          label="Model İsmi"
                          placeholder="Örn: Test Modeli"
                          value={settings.modelName}
                          onChange={handleChange('modelName')}
                          size="small"
                          margin="dense"
                        />
                      </SettingGroup>
                    )}
                    
                    {settings.showFooter && (
                      <SettingGroup title="Alt Bilgi Metni">
                        <TextField
                          fullWidth
                          label="Alt Bilgi"
                          value={settings.footerText}
                          onChange={handleChange('footerText')}
                          size="small"
                          margin="dense"
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Typography variant="caption" sx={{ mr: 1, minWidth: 60 }}>
                            Font Boyutu: 
                          </Typography>
                          <Slider 
                            value={settings.footerFontSize} 
                            onChange={handleSliderChange('footerFontSize')} 
                            min={8} max={14} 
                            step={1} 
                            size="small"
                            sx={{ flex: 1 }}
                          />
                        </Box>
                      </SettingGroup>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
            
            <StyledCard>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <SettingHeader 
                  icon={<Typography color="primary" variant="subtitle2" sx={{ fontSize: 'small' }}>aA</Typography>} 
                  title="Font ve Boyut Ayarları" 
                />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <SettingGroup title="Yazı Tipi">
                      <FormControl fullWidth size="small" margin="dense">
                        <InputLabel>Yazı Tipi</InputLabel>
                        <Select 
                          value={settings.fontFamily} 
                          onChange={handleChange('fontFamily')} 
                          label="Yazı Tipi"
                        >
                          <MenuItem value="Arial">Arial</MenuItem>
                          <MenuItem value="Helvetica">Helvetica</MenuItem>
                          <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                          <MenuItem value="Courier New">Courier New</MenuItem>
                        </Select>
                      </FormControl>
                    </SettingGroup>
                    
                    <SettingGroup title="Metin Boyutu">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ mr: 1, minWidth: 50 }}>
                          {settings.fontSize}pt
                        </Typography>
                        <Slider 
                          value={settings.fontSize} 
                          onChange={handleSliderChange('fontSize')} 
                          min={8} max={16} 
                          step={1} 
                          size="small"
                          sx={{ flex: 1 }}
                        />
                      </Box>
                    </SettingGroup>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <SettingGroup title="Fiş Boyutları" tooltip="Yazdırma için fiş boyutlarını ayarlayın">
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Genişlik (mm)"
                            value={settings.width}
                            onChange={handleChange('width')}
                            size="small"
                            margin="dense"
                            InputProps={{ inputProps: { min: 40, max: 120 } }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Yükseklik (mm)"
                            value={settings.minHeight}
                            onChange={handleChange('minHeight')}
                            size="small"
                            margin="dense"
                            InputProps={{ inputProps: { min: 80, max: 300 } }}
                          />
                        </Grid>
                      </Grid>
                    </SettingGroup>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Box sx={{ position: { md: 'sticky' }, top: 24 }}>
            <StyledCard elevation={2}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <SettingHeader 
                  icon={<PreviewIcon fontSize="small" color="primary" />} 
                  title="Fiş Önizleme" 
                />
                
                <Box sx={{ overflow: 'auto', display: 'flex', justifyContent: 'center', mt: 1 }}>
                  <Box id="receipt-preview">
                    <ReceiptPreview />
                  </Box>
                </Box>
              </CardContent>
            </StyledCard>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                size="small"
                sx={{ minWidth: 100 }}
              >
                Yazdır
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                size="small"
                sx={{ 
                  minWidth: 100,
                  bgcolor: hasChanges ? 'primary.main' : 'grey.400',
                  '&:hover': {
                    bgcolor: hasChanges ? 'primary.dark' : 'grey.500'
                  }
                }}
                disabled={!hasChanges || saving}
              >
                {saving ? 'Kaydediliyor...' : hasChanges ? 'Kaydet' : 'Kaydedildi'}
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <Button
                variant="text"
                size="small"
                onClick={handleReset}
                color="error"
                sx={{ fontSize: '0.7rem' }}
              >
                Varsayılana Sıfırla
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
} 