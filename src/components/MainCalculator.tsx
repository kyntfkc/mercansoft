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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  Chip
} from '@mui/material';
import { useStore } from '../store/useStore';
import { matchesAnySearch } from '../lib/search';
import { matchesMetalTypeFilter, MetalTypeFilter } from '../lib/metalType';
import MetalTypeToggle from './MetalTypeToggle';
import { companySettingsAPI, receiptSettingsAPI } from '../lib/api';
import {
  buildReceiptHtml,
  openPrintWindow,
  METAL_PRINT_LABELS,
  PrintMetalType,
} from '../lib/receipt';
import { DEFAULT_LOGO, prepareThermalPrintLogo, resolveLogoUrl } from '../lib/logo';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { toast } from 'react-hot-toast';

const cardSx = {
  height: 'auto',
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
  '&:last-child': { pb: 1.75 },
  display: 'flex',
  flexDirection: 'column' as const,
  flex: 1,
};

const sectionTitleSx = {
  fontWeight: 600,
  color: '#1F2937',
  fontSize: '0.875rem',
  mb: 1.25,
};

const rowGridSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
  gap: 1.25,
  alignItems: 'start',
};

// Model tipi tanımı
interface Model {
  id: string;
  name: string;
  stockCode?: string;
  category?: string;
  metalType?: 'altın' | 'gümüş';
  image?: string;
  stones: Array<{stoneId: string; quantity: number}>;
}

export default function MainCalculator() {
  const { 
    models, 
    selectedModelId, 
    productionCount, 
    calculationResult,
    calculationHistory,
    setSelectedModelId, 
    setProductionCount, 
    calculateTotalWeight,
    addToHistory,
    removeFromHistory,
    clearHistory
  } = useStore();

  // Görsel ve hesaplama sonucu gösterimi için durum
  const [showResults, setShowResults] = useState(false);
  
  // Üretim adedi için yerel durum
  const [localProductionCount, setLocalProductionCount] = useState<string>('');
  
  // Seçilen model için yerel durum
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [metalFilter, setMetalFilter] = useState<MetalTypeFilter>('all');
  const [clearHistoryDialogOpen, setClearHistoryDialogOpen] = useState(false);
  const [printMetalDialogOpen, setPrintMetalDialogOpen] = useState(false);
  const [stoneListOpen, setStoneListOpen] = useState(false);
  const pendingClearHistoryRef = useRef(false);

  const filteredModels = models.filter((model) => matchesMetalTypeFilter(model.metalType, metalFilter));

  // Varsayılan olarak boş değerler (sadece mount'ta)
  useEffect(() => {
    // İlk mount'ta sıfırla
    setSelectedModelId(null);
    setProductionCount(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedModel && !matchesMetalTypeFilter(selectedModel.metalType, metalFilter)) {
      setSelectedModel(null);
      setSelectedModelId(null);
      setShowResults(false);
      setStoneListOpen(false);
    }
  }, [metalFilter, selectedModel, setSelectedModelId]);

  // Seçili modelin resim URL'sini al
  const selectedModelImage = models.find(m => m.id === selectedModelId)?.image;

  // Tek taş ağırlığını hesaplama fonksiyonu
  const calculateSingleStoneWeight = (countPerGram: number): number => {
    if (countPerGram <= 0) return 0;
    return 1 / countPerGram;
  };

  // Hesaplama butonuna tıklama olayı
  const handleCalculate = () => {
    if (selectedModelId && localProductionCount) {
      setProductionCount(Number(localProductionCount));
      calculateTotalWeight();
      setShowResults(true);
      setStoneListOpen(false);
    }
  };
  
  // Enter tuşuna basıldığında hesapla
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCalculate();
    }
  };

  // Hesaplamayı geçmişe ekleme
  const handleAddToHistory = () => {
    if (!calculationResult) {
      toast.error("Lütfen önce hesaplama yapınız!");
      return;
    }
    addToHistory(calculationResult);
    toast.success("Hesaplama geçmişe eklendi!");
  };

  // Geçmişten kayıt silme
  const handleRemoveFromHistory = (id: string) => {
    removeFromHistory(id);
    toast.success("Kayıt silindi!");
  };

  // Geçmiş temizleme onay diyaloğu
  const handleOpenClearHistoryDialog = () => {
    if (calculationHistory.length === 0) {
      toast.error("Temizlenecek hesaplama bulunmuyor!");
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
    toast.success("Hesaplama geçmişi temizlendi!");
  };

  const handleOpenPrintMetalDialog = () => {
    if (calculationHistory.length === 0) {
      toast.error("Yazdırılacak hesaplama bulunmuyor!");
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

      openPrintWindow(html);
    } catch (error: any) {
      console.error("Yazdırma hatası:", error);
      toast.error(error?.message || "Yazdırma sırasında bir hata oluştu");
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 920,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
      }}
    >
      {/* Üst satır: Model Seçimi | Model Görseli */}
      <Box sx={rowGridSx}>
        <Card sx={cardSx}>
          <CardContent sx={cardContentSx}>
            <Typography variant="subtitle1" sx={sectionTitleSx}>
              Model Seçimi ve Üretim Adedi
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
                setStoneListOpen(false);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  label="Model veya Stok Kodu ile Ara"
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
              label="Üretim Adedi"
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
                  setStoneListOpen(false);
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
              helperText="Hesaplamak için Enter tuşuna basın"
              sx={{ mb: 0, '& .MuiFormHelperText-root': { mt: 0.5, mb: 0 } }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
              <Button
                variant="contained"
                color="secondary"
                sx={{
                  px: 2.5,
                  py: 0.6,
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                }}
                onClick={handleCalculate}
                disabled={!selectedModelId || !localProductionCount}
              >
                Hesapla
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card sx={cardSx}>
          <CardContent sx={cardContentSx}>
            <Typography variant="subtitle1" sx={sectionTitleSx}>
              Model Görseli
            </Typography>

            {selectedModelImage ? (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: { xs: 260, md: 300 },
                  bgcolor: '#f7f8fa',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  p: 1.25,
                }}
              >
                <CardMedia
                  component="img"
                  sx={{
                    maxHeight: 280,
                    maxWidth: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                  image={selectedModelImage}
                  alt="Model Görseli"
                />
              </Box>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  minHeight: { xs: 260, md: 300 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#f7f8fa',
                  borderRadius: '10px',
                  border: '1px dashed #e5e7eb',
                }}
              >
                <Typography color="#6B7280" variant="body2" sx={{ fontSize: '0.8125rem' }}>
                  {selectedModelId ? 'Model görseli mevcut değil' : 'Model seçildiğinde görsel burada görünür'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Alt satır: Hesaplama Sonucu | Hesaplama Geçmişi */}
      <Box sx={rowGridSx}>
        <Card sx={{ ...cardSx, height: 300, minHeight: 300 }}>
          <CardContent sx={cardContentSx}>
            <Typography variant="subtitle1" sx={sectionTitleSx}>
              Hesaplama Sonucu
            </Typography>

            {showResults && calculationResult ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    py: 2,
                    px: 1.5,
                    borderRadius: '10px',
                    bgcolor: '#EFF6FF',
                    border: '1.5px solid #2563EB',
                    width: '100%',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: '#2563EB', fontWeight: 600, fontSize: '0.75rem', mb: 0.75 }}
                  >
                    Toplam Taş Gramı
                  </Typography>
                  <Typography
                    variant="h2"
                    fontWeight={700}
                    sx={{
                      color: '#2563EB',
                      fontSize: { xs: '1.75rem', md: '2.125rem' },
                      lineHeight: 1.1,
                    }}
                  >
                    {calculationResult.totalWeight.toFixed(2)} gr
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      flex: 1,
                      p: 1.25,
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      bgcolor: '#ffffff',
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: '#6B7280', fontWeight: 500, fontSize: '0.6875rem', mb: 0.5 }}
                    >
                      Model Adı
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#1F2937', fontWeight: 500, fontSize: '0.8125rem', lineHeight: 1.3 }}
                    >
                      {calculationResult.modelName}
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      flex: 1,
                      p: 1.25,
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      bgcolor: '#ffffff',
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: '#6B7280', fontWeight: 500, fontSize: '0.6875rem', mb: 0.5 }}
                    >
                      Üretim Adedi
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: '#1F2937', fontWeight: 600, fontSize: '1rem' }}
                    >
                      {calculationResult.productionCount}
                    </Typography>
                  </Paper>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddToHistory}
                    sx={{
                      bgcolor: '#2563EB',
                      color: 'white',
                      borderRadius: '8px',
                      px: 2,
                      py: 0.6,
                      fontWeight: 500,
                      fontSize: '0.8125rem',
                      textTransform: 'none',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                      '&:hover': {
                        bgcolor: '#1D4ED8',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                  >
                    Ekle
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#f7f8fa',
                  borderRadius: '10px',
                  border: '1px dashed #e5e7eb',
                  minHeight: 220,
                }}
              >
                <Typography color="#6B7280" variant="body2" sx={{ fontSize: '0.8125rem', textAlign: 'center', px: 2 }}>
                  Hesapla ile sonuç burada görünür
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card sx={{ ...cardSx, height: 300, minHeight: 300, overflow: 'hidden' }}>
          <CardContent sx={{ ...cardContentSx, height: '100%', minHeight: 0, overflow: 'hidden' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1.25,
                gap: 1,
                minHeight: 32,
                flexShrink: 0,
              }}
            >
              <Typography variant="subtitle1" sx={{ ...sectionTitleSx, mb: 0 }}>
                Hesaplama Geçmişi
              </Typography>
              <Button
                size="small"
                onClick={handleOpenClearHistoryDialog}
                startIcon={<DeleteIcon fontSize="small" />}
                disabled={calculationHistory.length === 0}
                sx={{
                  color: '#EF4444',
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.8125rem',
                  borderRadius: '8px',
                  px: 1,
                  minWidth: 'auto',
                  visibility: calculationHistory.length > 0 ? 'visible' : 'hidden',
                  '&:hover': { bgcolor: '#FEE2E2' },
                }}
              >
                Temizle
              </Button>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {calculationHistory.length > 0 ? (
                <>
                  <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', mb: 1.25, pr: 0.5 }}>
                    <List sx={{ py: 0 }}>
                      {calculationHistory.map((item) => (
                        <ListItem
                          key={item.id}
                          sx={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            mb: 0.75,
                            px: 1.25,
                            py: 0.75,
                            bgcolor: '#ffffff',
                            minHeight: '48px',
                            '&:hover': {
                              bgcolor: '#f7f8fa',
                              borderColor: '#d1d5db',
                            },
                          }}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleRemoveFromHistory(item.id)}
                              size="small"
                              sx={{
                                color: '#EF4444',
                                p: 0.5,
                                '&:hover': { bgcolor: '#FEE2E2' },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                sx={{
                                  fontSize: '0.8125rem',
                                  color: '#1F2937',
                                  lineHeight: 1.5,
                                  mb: 0.25,
                                }}
                              >
                                {item.modelName}
                              </Typography>
                            }
                            secondary={
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.75rem',
                                  color: '#6B7280',
                                  display: 'block',
                                  lineHeight: 1.5,
                                }}
                              >
                                {item.productionCount} adet • {item.totalWeight.toFixed(2)} gr
                              </Typography>
                            }
                            sx={{
                              my: 0,
                              '& .MuiListItemText-primary': { mb: 0 },
                              '& .MuiListItemText-secondary': { mt: 0 },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

                  <Box
                    sx={{
                      p: 1.25,
                      borderRadius: '8px',
                      bgcolor: '#2563EB',
                      textAlign: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'white',
                        fontWeight: 500,
                        fontSize: '0.6875rem',
                        display: 'block',
                        mb: 0.25,
                      }}
                    >
                      Toplam Taş Gramı
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{ color: 'white', fontSize: '1rem', lineHeight: 1.2 }}
                    >
                      {calculationHistory.reduce((sum, item) => sum + item.totalWeight, 0).toFixed(2)} gr
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    startIcon={<PrintIcon />}
                    onClick={handleOpenPrintMetalDialog}
                    fullWidth
                    sx={{
                      bgcolor: '#2563EB',
                      color: 'white',
                      borderRadius: '8px',
                      py: 0.75,
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      textTransform: 'none',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                      '&:hover': {
                        bgcolor: '#1D4ED8',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                  >
                    Yazdır
                  </Button>
                </>
              ) : (
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6B7280',
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
                    Henüz hesaplama eklenmemiş
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Taş Listesi - accordion (sabit alan: sayfa kaymasın) */}
      <Box sx={{ minHeight: 52 }}>
        {showResults && calculationResult && calculationResult.stoneDetails.length > 0 && (
          <Card sx={{ ...cardSx, height: 'auto' }}>
            <Box
              onClick={() => setStoneListOpen((open) => !open)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.75,
                py: 1.25,
                cursor: 'pointer',
                userSelect: 'none',
                '&:hover': { bgcolor: '#f9fafb' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: '#1F2937', fontSize: '0.875rem', m: 0 }}
                >
                  Taş Listesi
                </Typography>
                <Chip
                  size="small"
                  label={calculationResult.stoneDetails.length}
                  sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600 }}
                />
              </Box>
              <ExpandMoreIcon
                sx={{
                  color: '#6B7280',
                  transform: stoneListOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </Box>

            <Collapse in={stoneListOpen} timeout="auto" unmountOnExit>
              <CardContent sx={{ ...cardContentSx, pt: 0 }}>
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{
                    borderRadius: '10px',
                    border: '1px solid #E5E7EB',
                    overflow: 'hidden',
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                        <TableCell
                          sx={{
                            fontWeight: 500,
                            color: '#1F2937',
                            fontSize: '0.875rem',
                            borderBottom: '1px solid #E5E7EB',
                          }}
                          width="70%"
                        >
                          Taş Adı
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 500,
                            color: '#1F2937',
                            fontSize: '0.875rem',
                            borderBottom: '1px solid #E5E7EB',
                          }}
                          width="30%"
                        >
                          Adet
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {calculationResult.stoneDetails.map((detail) => (
                        <TableRow
                          key={detail.stoneId}
                          sx={{
                            '&:hover': { bgcolor: '#F9FAFB' },
                            '&:last-child td': { borderBottom: 'none' },
                          }}
                        >
                          <TableCell
                            sx={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 0,
                              color: '#1F2937',
                              fontSize: '0.875rem',
                              borderBottom: '1px solid #E5E7EB',
                            }}
                          >
                            {detail.stoneName}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: '#1F2937',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              borderBottom: '1px solid #E5E7EB',
                            }}
                          >
                            {detail.quantity}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Collapse>
          </Card>
        )}
      </Box>

      <Dialog
        open={clearHistoryDialogOpen}
        onClose={() => setClearHistoryDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        disableScrollLock
        TransitionProps={{ onExited: handleClearHistoryDialogExited }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1F2937' }}>
          Geçmişi Temizle
        </DialogTitle>
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
        <DialogTitle sx={{ fontWeight: 600, color: '#1F2937' }}>
          Metal Türü Seçin
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#4B5563', fontSize: '0.9375rem', mb: 2 }}>
            Fişe eklenecek metal bilgisini seçin.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handlePrintHistory('altın')}
              sx={{
                textTransform: 'none',
                py: 1.25,
                fontWeight: 600,
                bgcolor: '#B45309',
                '&:hover': { bgcolor: '#92400E' },
              }}
            >
              Altın — 14 Ayar Yeşil
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handlePrintHistory('gümüş')}
              sx={{
                textTransform: 'none',
                py: 1.25,
                fontWeight: 600,
                bgcolor: '#64748B',
                '&:hover': { bgcolor: '#475569' },
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
