'use client';

import { useEffect, useState, useRef, KeyboardEvent } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  Paper,
  Autocomplete,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useStore } from '../store/useStore';
import { matchesAnySearch } from '../lib/search';
import { matchesMetalTypeFilter, MetalTypeFilter } from '../lib/metalType';
import MetalTypeToggle from './MetalTypeToggle';
import { companySettingsAPI, receiptSettingsAPI } from '../lib/api';
import {
  buildReceiptHtml,
  printReceipt,
  METAL_PRINT_LABELS,
  PrintMetalType,
} from '../lib/receipt';
import { DEFAULT_LOGO, prepareThermalPrintLogo, resolveLogoUrl } from '../lib/logo';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-hot-toast';

const cardSx = {
  height: '100%',
  alignSelf: 'stretch',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  border: '1px solid #e5e7eb',
  bgcolor: '#ffffff',
  display: 'flex',
  flexDirection: 'column' as const,
};

const cardContentSx = {
              p: 1.75,
              '&:last-child': { pb: 2 },
              display: 'flex',
              flexDirection: 'column' as const,
              flex: 1,
              minHeight: 0,
};

const sectionTitleSx = {
  fontWeight: 600,
  color: '#1F2937',
  fontSize: '0.875rem',
  mb: 1.5,
  textAlign: 'center' as const,
};

const threeColGridSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
  gap: 1.5,
  alignItems: 'stretch',
  minHeight: { md: 560 },
};

const charcoalBtnSx = {
  bgcolor: '#334155',
  color: 'white',
  borderRadius: '8px',
  py: 0.85,
  fontWeight: 600,
  fontSize: '0.875rem',
  textTransform: 'none' as const,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  '&:hover': { bgcolor: '#1E293B' },
  '&.Mui-disabled': {
    bgcolor: '#E5E7EB',
    color: '#9CA3AF',
  },
};

interface Model {
  id: string;
  name: string;
  stockCode?: string;
  category?: string;
  metalType?: 'altın' | 'gümüş';
  image?: string;
  stones: Array<{ stoneId: string; quantity: number }>;
}

export default function MainCalculator() {
  const {
    models,
    selectedModelId,
    calculationResult,
    calculationHistory,
    setSelectedModelId,
    setProductionCount,
    calculateTotalWeight,
    addToHistory,
    removeFromHistory,
    clearHistory,
  } = useStore();

  const [showResults, setShowResults] = useState(false);
  const [localProductionCount, setLocalProductionCount] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [metalFilter, setMetalFilter] = useState<MetalTypeFilter>('all');
  const [clearHistoryDialogOpen, setClearHistoryDialogOpen] = useState(false);
  const [printMetalDialogOpen, setPrintMetalDialogOpen] = useState(false);
  const pendingClearHistoryRef = useRef(false);

  const filteredModels = models.filter((model) => matchesMetalTypeFilter(model.metalType, metalFilter));

  useEffect(() => {
    setSelectedModelId(null);
    setProductionCount(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedModel && !matchesMetalTypeFilter(selectedModel.metalType, metalFilter)) {
      setSelectedModel(null);
      setSelectedModelId(null);
      setShowResults(false);
    }
  }, [metalFilter, selectedModel, setSelectedModelId]);

  const selectedModelImage = models.find((m) => m.id === selectedModelId)?.image;

  const canCalculate = Boolean(selectedModelId && localProductionCount);
  const calculateHint = !selectedModelId
    ? 'Önce model seçin'
    : !localProductionCount
      ? 'Üretim adedi girin'
      : 'Hesaplamak için Enter tuşuna basın';

  const historyTotal = calculationHistory.reduce((sum, item) => sum + item.totalWeight, 0);

  const handleCalculate = () => {
    if (selectedModelId && localProductionCount) {
      setProductionCount(Number(localProductionCount));
      calculateTotalWeight();
      setShowResults(true);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCalculate();
    }
  };

  const handleAddToHistory = () => {
    if (!calculationResult) {
      toast.error('Lütfen önce hesaplama yapınız!');
      return;
    }
    addToHistory(calculationResult);
    toast.success('Hesaplama geçmişe eklendi!');
  };

  const handleRemoveFromHistory = (id: string) => {
    removeFromHistory(id);
    toast.success('Kayıt silindi!');
  };

  const handleOpenClearHistoryDialog = () => {
    if (calculationHistory.length === 0) {
      toast.error('Temizlenecek hesaplama bulunmuyor!');
      return;
    }
    setClearHistoryDialogOpen(true);
  };

  const handleConfirmClearHistory = () => {
    pendingClearHistoryRef.current = true;
    setClearHistoryDialogOpen(false);
  };

  const handleClearHistoryDialogExited = () => {
    if (!pendingClearHistoryRef.current) return;
    pendingClearHistoryRef.current = false;
    clearHistory();
    toast.success('Hesaplama geçmişi temizlendi!');
  };

  const handleOpenPrintMetalDialog = () => {
    if (calculationHistory.length === 0) {
      toast.error('Yazdırılacak hesaplama bulunmuyor!');
      return;
    }
    setPrintMetalDialogOpen(true);
  };

  const handlePrintHistory = async (metalType: PrintMetalType) => {
    setPrintMetalDialogOpen(false);

    try {
      const [settings, company] = await Promise.all([
        receiptSettingsAPI.get(),
        companySettingsAPI.get().catch(() => null),
      ]);

      const totalWeight = calculationHistory.reduce(
        (sum, item) => sum + Number(item.totalWeight || 0),
        0
      );

      const rawLogo = company?.logo || DEFAULT_LOGO;
      const cleanedLogo = await prepareThermalPrintLogo(resolveLogoUrl(rawLogo), 160);

      const html = buildReceiptHtml(
        settings,
        {
          totalWeight,
          metalLabel: METAL_PRINT_LABELS[metalType],
          printedAt: new Date(),
        },
        cleanedLogo
      );

      const result = await printReceipt(html, {
        width: settings.width,
        minHeight: settings.minHeight,
      });

      if (result.silent) {
        toast.success(result.message || 'Fiş yazıcıya gönderildi');
      } else if (result.message) {
        toast(result.message);
      }
    } catch (error: any) {
      console.error('Yazdırma hatası:', error);
      toast.error(error?.message || 'Yazdırma sırasında bir hata oluştu');
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
      }}
    >
      <Box sx={threeColGridSx}>
        {/* Hesaplama — masaüstünde orta */}
        <Card sx={{ ...cardSx, order: { xs: 2, md: 2 } }}>
          <CardContent sx={cardContentSx}>
            <Typography variant="subtitle1" sx={sectionTitleSx}>
              Hesaplama
            </Typography>

            <Box sx={{ mb: 1.25 }}>
              <MetalTypeToggle value={metalFilter} onChange={setMetalFilter} />
            </Box>

            <Autocomplete
              id="model-autocomplete"
              options={filteredModels}
              getOptionLabel={(option) => option.name}
              filterOptions={(options, state) => {
                const inputValue = state.inputValue;
                if (!inputValue.trim()) {
                  return options;
                }
                return options.filter((option) =>
                  matchesAnySearch(inputValue, option.name, option.stockCode, option.category)
                );
              }}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <li key={key} {...otherProps}>
                    <div>
                      <strong>{option.name}</strong>
                      {option.stockCode && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          Stok: {option.stockCode}
                        </Typography>
                      )}
                    </div>
                  </li>
                );
              }}
              value={selectedModel}
              onChange={(_, newValue) => {
                setSelectedModel(newValue);
                setSelectedModelId(newValue?.id || null);
                setShowResults(false);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  label="Model seçimi"
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1 }}
                  placeholder="Model adı veya stok kodu yazın..."
                  onFocus={(e) => {
                    e.target.value = '';
                    setTimeout(() => {
                      const input = e.target as HTMLInputElement;
                      if (!input.value && document.activeElement === input) {
                        input.select();
                      }
                    }, 10);
                  }}
                />
              )}
              noOptionsText="Model bulunamadı"
              size="small"
            />

            <TextField
              label="Üretim adedi"
              type="number"
              fullWidth
              margin="dense"
              size="small"
              value={localProductionCount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (/^[1-9][0-9]*$/.test(value) && parseInt(value) > 0)) {
                  setLocalProductionCount(value);
                  setShowResults(false);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Üretim adedini girin"
              inputProps={{
                min: 1,
                style: {
                  WebkitAppearance: 'none',
                  MozAppearance: 'textfield',
                },
              }}
              helperText={calculateHint}
              sx={{ mb: 0, '& .MuiFormHelperText-root': { mt: 0.5, mb: 0 } }}
            />

            <Box sx={{ mt: 1.5 }}>
              <Button
                variant="contained"
                fullWidth
                sx={charcoalBtnSx}
                onClick={handleCalculate}
                disabled={!canCalculate}
              >
                Hesapla
              </Button>
            </Box>

            {showResults && calculationResult && (
              <Box sx={{ mt: 'auto', pt: 1.75, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Typography
                  sx={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: 500, mb: -0.5 }}
                >
                  Hesaplama sonucu
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 3.5,
                    px: 1.5,
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    bgcolor: '#ffffff',
                  }}
                >
                  <Typography
                    sx={{
                      color: '#0F172A',
                      fontSize: { xs: '1.75rem', md: '2rem' },
                      fontWeight: 700,
                      lineHeight: 1.1,
                    }}
                  >
                    {calculationResult.totalWeight.toFixed(2).replace('.', ',')} gr
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddToHistory}
                  fullWidth
                  sx={charcoalBtnSx}
                >
                  Geçmişe ekle
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Model görseli — masaüstünde sol */}
        <Card sx={{ ...cardSx, order: { xs: 1, md: 1 } }}>
          <CardContent sx={cardContentSx}>
            <Typography variant="subtitle1" sx={sectionTitleSx}>
              Model görseli
            </Typography>

            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: { xs: 220, md: 280 },
                bgcolor: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                p: 1.25,
                mb: 1.5,
              }}
            >
              {selectedModelImage ? (
                <CardMedia
                  component="img"
                  sx={{
                    maxHeight: 300,
                    maxWidth: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                  image={selectedModelImage}
                  alt="Ürün fotoğrafı"
                />
              ) : (
                <Typography color="#94A3B8" variant="body2" sx={{ fontSize: '0.875rem' }}>
                  Ürün fotoğrafı
                </Typography>
              )}
            </Box>

            <Paper
              elevation={0}
              sx={{
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                p: 1.5,
                bgcolor: '#ffffff',
                minHeight: 110,
              }}
            >
              <Typography
                sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#1F2937', mb: 0.75, textAlign: 'center' }}
              >
                Taş listesi
              </Typography>
              {showResults && calculationResult && calculationResult.stoneDetails.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {calculationResult.stoneDetails.map((detail) => (
                    <Box key={detail.stoneId}>
                      <Typography
                        sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1F2937', lineHeight: 1.3 }}
                      >
                        {detail.stoneName}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {detail.quantity} adet - {detail.totalWeight.toFixed(2).replace('.', ',')} gr
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center' }}>
                  Hesaplama sonrası taşlar burada görünür
                </Typography>
              )}
            </Paper>
          </CardContent>
        </Card>

        {/* Hesaplama geçmişi — sağ */}
        <Card sx={{ ...cardSx, order: { xs: 3, md: 3 } }}>
          <CardContent sx={cardContentSx}>
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
                minHeight: 32,
              }}
            >
              <Typography variant="subtitle1" sx={{ ...sectionTitleSx, mb: 0 }}>
                Hesaplama geçmişi
              </Typography>
              {calculationHistory.length > 0 && (
                <Button
                  size="small"
                  onClick={handleOpenClearHistoryDialog}
                  startIcon={<DeleteIcon fontSize="small" />}
                  sx={{
                    position: 'absolute',
                    right: 0,
                    color: '#EF4444',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    borderRadius: '8px',
                    px: 1,
                    minWidth: 'auto',
                    '&:hover': { bgcolor: '#FEE2E2' },
                  }}
                >
                  Temizle
                </Button>
              )}
            </Box>

            {calculationHistory.length > 0 ? (
              <>
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    maxHeight: { xs: 300, md: 380 },
                    overflowY: 'auto',
                    mb: 1.25,
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 48px 56px 32px',
                      gap: 0.5,
                      px: 1.25,
                      py: 0.75,
                      bgcolor: '#F8FAFC',
                      borderBottom: '1px solid #e5e7eb',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B' }}>
                      Model
                    </Typography>
                    <Typography
                      sx={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textAlign: 'right' }}
                    >
                      Adet
                    </Typography>
                    <Typography
                      sx={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textAlign: 'right' }}
                    >
                      Gram
                    </Typography>
                    <Box />
                  </Box>

                  {calculationHistory.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 48px 56px 32px',
                        gap: 0.5,
                        alignItems: 'center',
                        px: 1.25,
                        py: 0.85,
                        borderBottom: '1px solid #f1f5f9',
                        '&:last-child': { borderBottom: 'none' },
                        '&:hover': { bgcolor: '#f8fafc' },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#1F2937',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={item.modelName}
                      >
                        {item.modelName}
                      </Typography>
                      <Typography
                        sx={{ fontSize: '0.75rem', color: '#334155', textAlign: 'right', fontWeight: 500 }}
                      >
                        {item.productionCount}
                      </Typography>
                      <Typography
                        sx={{ fontSize: '0.75rem', color: '#334155', textAlign: 'right', fontWeight: 500 }}
                      >
                        {item.totalWeight.toFixed(2).replace('.', ',')}
                      </Typography>
                      <IconButton
                        aria-label="delete"
                        onClick={() => handleRemoveFromHistory(item.id)}
                        size="small"
                        sx={{
                          color: '#EF4444',
                          p: 0.25,
                          justifySelf: 'end',
                          '&:hover': { bgcolor: '#FEE2E2' },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>

                <Box
                  sx={{
                    p: 1.25,
                    borderRadius: '8px',
                    bgcolor: '#2563EB',
                    textAlign: 'center',
                    mb: 1,
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      lineHeight: 1.2,
                    }}
                  >
                    Toplam: {historyTotal.toFixed(2).replace('.', ',')} gr
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<PrintIcon />}
                  onClick={handleOpenPrintMetalDialog}
                  fullWidth
                  sx={{ ...charcoalBtnSx, flexShrink: 0 }}
                >
                  Yazdır
                </Button>
              </>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  minHeight: 180,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94A3B8',
                  bgcolor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px dashed #e2e8f0',
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                  Henüz hesaplama eklenmemiş
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      <Dialog
        open={clearHistoryDialogOpen}
        onClose={() => setClearHistoryDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        disableScrollLock
        TransitionProps={{ onExited: handleClearHistoryDialogExited }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1F2937' }}>Geçmişi Temizle</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#4B5563', fontSize: '0.9375rem' }}>
            Tüm hesaplama geçmişini temizlemek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setClearHistoryDialogOpen(false)}
            sx={{ textTransform: 'none', color: '#6B7280' }}
          >
            İptal
          </Button>
          <Button
            onClick={handleConfirmClearHistory}
            variant="contained"
            sx={{
              textTransform: 'none',
              bgcolor: '#EF4444',
              '&:hover': { bgcolor: '#DC2626' },
            }}
          >
            Temizle
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={printMetalDialogOpen}
        onClose={() => setPrintMetalDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        disableScrollLock
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1F2937' }}>Metal Türü Seçin</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#4B5563', fontSize: '0.9375rem', mb: 2 }}>
            Fişe eklenecek metal bilgisini seçin.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Button
              variant="contained"
              fullWidth
              disableElevation
              onClick={() => handlePrintHistory('altın')}
              sx={{
                textTransform: 'none',
                py: 1.25,
                fontWeight: 600,
                color: '#78350F',
                bgcolor: '#F5C542',
                backgroundImage: 'linear-gradient(180deg, #F8D56B 0%, #E6B422 100%)',
                border: '1px solid #D4A017',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#E6B422',
                  backgroundImage: 'linear-gradient(180deg, #F0C94A 0%, #D4A017 100%)',
                  boxShadow: 'none',
                },
              }}
            >
              Altın — 14 Ayar Yeşil
            </Button>
            <Button
              variant="contained"
              fullWidth
              disableElevation
              onClick={() => handlePrintHistory('gümüş')}
              sx={{
                textTransform: 'none',
                py: 1.25,
                fontWeight: 600,
                color: '#1F2937',
                bgcolor: '#C0C5CE',
                backgroundImage: 'linear-gradient(180deg, #D8DCE3 0%, #A8AEB8 100%)',
                border: '1px solid #9CA3AF',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#A8AEB8',
                  backgroundImage: 'linear-gradient(180deg, #C5CAD2 0%, #949AA5 100%)',
                  boxShadow: 'none',
                },
              }}
            >
              Gümüş — 925 ayar Gümüş
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setPrintMetalDialogOpen(false)}
            sx={{ textTransform: 'none', color: '#6B7280' }}
          >
            İptal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
