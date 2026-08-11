'use client';

import { useEffect, useState, KeyboardEvent } from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  TextField, 
  Button, 
  Grid, 
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
  Divider,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import { useStore } from '../store/useStore';
import { matchesAnySearch } from '../lib/search';
import { matchesMetalTypeFilter, MetalTypeFilter } from '../lib/metalType';
import MetalTypeToggle from './MetalTypeToggle';
import { companySettingsAPI, receiptSettingsAPI } from '../lib/api';
import { buildReceiptHtml, openPrintWindow } from '../lib/receipt';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-hot-toast';

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
    stones, 
    selectedModelId, 
    productionCount, 
    calculationResult,
    calculationHistory,
    setSelectedModelId, 
    setProductionCount, 
    calculateTotalWeight,
    addToHistory,
    removeFromHistory
  } = useStore();

  // Görsel ve hesaplama sonucu gösterimi için durum
  const [showResults, setShowResults] = useState(false);
  
  // Üretim adedi için yerel durum
  const [localProductionCount, setLocalProductionCount] = useState<string>('');
  
  // Seçilen model için yerel durum
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [metalFilter, setMetalFilter] = useState<MetalTypeFilter>('all');

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

  // Geçmiş listesinin tamamını yazdır
  const handlePrintHistory = async () => {
    if (calculationHistory.length === 0) {
      toast.error("Yazdırılacak hesaplama bulunmuyor!");
      return;
    }

    try {
      const [settings, company] = await Promise.all([
        receiptSettingsAPI.get(),
        companySettingsAPI.get().catch(() => null),
      ]);

      const resolveStoneDetails = (item: (typeof calculationHistory)[number]) => {
        if (item.stoneDetails && item.stoneDetails.length > 0) {
          return item.stoneDetails.map((detail) => ({
            stoneName: detail.stoneName,
            quantity: detail.quantity,
            totalWeight: detail.totalWeight,
          }));
        }

        const model = models.find((m) => m.name === item.modelName);
        if (!model) return [];

        return model.stones.map((modelStone) => {
          const stone = stones.find((s) => s.id === modelStone.stoneId);
          const quantity = modelStone.quantity * item.productionCount;
          const countPerGram = stone?.countPerGram || 0;
          const singleWeight = countPerGram > 0 ? 1 / countPerGram : 0;
          return {
            stoneName: stone?.name || 'Bilinmeyen Taş',
            quantity,
            totalWeight: singleWeight * quantity,
          };
        });
      };

      const html = buildReceiptHtml(
        settings,
        {
          items: calculationHistory.map((item) => ({
            modelName: item.modelName,
            productionCount: item.productionCount,
            totalWeight: item.totalWeight,
            stoneDetails: resolveStoneDetails(item),
          })),
          printedAt: new Date(),
        },
        company?.logo
      );

      openPrintWindow(html);
    } catch (error: any) {
      console.error("Yazdırma hatası:", error);
      toast.error(error?.message || "Yazdırma sırasında bir hata oluştu");
    }
  };

  return (
    <Box sx={{ 
      width: '100%'
    }}>
        {/* Giriş Alanı - Ortalanmış Kompakt Kart */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
      <Card sx={{ 
        width: '100%',
            maxWidth: '600px',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb',
            bgcolor: '#ffffff'
      }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography 
                variant="body1" 
                fontWeight={500} 
                sx={{ mb: 2, fontSize: '0.9375rem' }}
              >
            Model Seçimi ve Üretim Adedi
          </Typography>

          <Box sx={{ mb: 2 }}>
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
              setShowResults(false); // Model değiştiğinde sonuçları gizle
            }}
            renderInput={(params) => (
              <TextField 
                {...params}
                margin="dense"
                label="Model veya Stok Kodu ile Ara" 
                variant="outlined"
                size="small"
                sx={{ mb: 1.5 }}
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
              // Sadece pozitif sayılara izin ver
              if (value === '' || (/^[1-9][0-9]*$/.test(value) && parseInt(value) > 0)) {
                setLocalProductionCount(value);
                setShowResults(false); // Değişiklik olduğunda sonuçları gizle
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Üretim adedini girin"
            inputProps={{ 
              min: 1,
              style: { 
                WebkitAppearance: 'none',
                MozAppearance: 'textfield'
              }
            }}
            helperText="Hesaplamak için Enter tuşuna basın"
            sx={{ mb: 0 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button 
              variant="contained" 
              color="secondary" 
              sx={{ 
                px: 3,
                py: 0.75,
                color: 'white',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.875rem'
              }}
              onClick={handleCalculate}
              disabled={!selectedModelId || !localProductionCount}
            >
              Hesapla
            </Button>
          </Box>
        </CardContent>
      </Card>
        </Box>

      {showResults && (
        <>
          <Box sx={{ 
            width: '100%',
            display: { xs: 'flex', lg: 'grid' },
            flexDirection: { xs: 'column', lg: 'unset' },
            gridTemplateColumns: { lg: '1.3fr 1fr 1fr' },
            gap: 3,
            mb: 2.5
          }}>
            {/* Model Görseli Kartı */}
            <Card sx={{ 
              height: 'fit-content',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
              border: '1px solid #E5E7EB',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column' }}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight={600} 
                  sx={{ 
                    mb: 2,
                    color: '#1F2937',
                    fontSize: '16px'
                  }}
                >
                    Model Görseli
                  </Typography>
                  
                  {selectedModelImage ? (
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '380px',
                      bgcolor: '#f7f8fa',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      p: 2
                    }}>
                      <CardMedia
                        component="img"
                        sx={{ 
                          maxHeight: '100%',
                          maxWidth: '100%',
                          objectFit: 'contain',
                          borderRadius: '8px'
                        }}
                        image={selectedModelImage}
                        alt="Model Görseli"
                      />
                    </Box>
                  ) : (
                    <Box 
                      sx={{ 
                        minHeight: '380px',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        bgcolor: '#f7f8fa',
                        borderRadius: '12px',
                        border: '1px dashed #e5e7eb'
                      }}
                    >
                      <Typography color="#6B7280" variant="body2" sx={{ fontSize: '0.8125rem' }}>
                        Model görseli mevcut değil
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            
            {/* Hesaplama Sonucu - Daha Büyük ve Dikkat Çekici */}
              {calculationResult && (
                <Card sx={{ 
                height: 'fit-content',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                border: '1px solid #E5E7EB',
                display: 'flex',
                flexDirection: 'column'
                }}>
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
                    <Typography 
                    variant="subtitle1" 
                      sx={{ 
                        mb: 3, 
                      fontWeight: 600,
                      color: '#1F2937',
                      fontSize: '16px'
                      }}
                    >
                      Hesaplama Sonucu
                    </Typography>
                    
                  {/* Toplam Taş Gramı - Daha Büyük ve Dikkat Çekici */}
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      mb: 3,
                    p: 4,
                    borderRadius: '12px',
                    bgcolor: '#EFF6FF',
                    border: '2px solid #2563EB',
                    width: '100%'
                    }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#2563EB', 
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        mb: 1.5
                      }}
                    >
                        Toplam Taş Gramı
                      </Typography>
                      <Typography 
                      variant="h2" 
                      fontWeight={700} 
                      sx={{ 
                        color: '#2563EB',
                        fontSize: { xs: '2rem', md: '2.75rem' },
                        lineHeight: 1.1
                      }}
                      >
                        {calculationResult.totalWeight.toFixed(2)} gr
                      </Typography>
                    </Box>
                    
                  {/* Model Adı ve Üretim Adedi */}
                    <Box 
                      sx={{
                        display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                      mb: 2
                      }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                              flex: 1,
                              p: 2,
                              borderRadius: '10px',
                              border: '1px solid #e5e7eb',
                              bgcolor: '#ffffff',
                              textAlign: 'center'
                        }}
                      >
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#6B7280', 
                                fontWeight: 500,
                                fontSize: '0.8125rem',
                                mb: 1
                              }}
                            >
                          Model Adı
                        </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#1F2937',
                                fontWeight: 500,
                                fontSize: '0.9375rem',
                                lineHeight: 1.4
                              }}
                            >
                          {calculationResult.modelName}
                        </Typography>
                      </Paper>
                      
                      <Paper
                        elevation={0}
                        sx={{
                              flex: 1,
                              p: 2,
                              borderRadius: '10px',
                              border: '1px solid #e5e7eb',
                              bgcolor: '#ffffff',
                              textAlign: 'center'
                        }}
                      >
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#6B7280', 
                                fontWeight: 500,
                                fontSize: '0.8125rem',
                                mb: 1
                              }}
                            >
                          Üretim Adedi
                        </Typography>
                        <Typography 
                          variant="h6" 
                              sx={{ 
                                color: '#1F2937',
                                fontWeight: 600,
                                fontSize: '1.25rem'
                              }}
                        >
                          {calculationResult.productionCount}
                        </Typography>
                      </Paper>
                    </Box>
                  </CardContent>
                  
                {/* Ekle Butonu - Ortalanmış Küçük */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                  pb: 2.5,
                  px: 3
                }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddToHistory}
                    sx={{
                      bgcolor: '#2563EB',
                      color: 'white',
                      borderRadius: '8px',
                      px: 2.5,
                      py: 0.875,
                      fontWeight: 500,
                      fontSize: '0.8125rem',
                      textTransform: 'none',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                      '&:hover': {
                        bgcolor: '#1D4ED8',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }
                    }}
                  >
                    Ekle
                  </Button>
                </Box>
              </Card>
            )}
            
            {/* Hesaplama Geçmişi - Sağ Sidebar */}
            <Card sx={{ 
              height: 'fit-content',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
              bgcolor: '#ffffff',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column' }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 2.5, 
                    fontWeight: 600,
                    color: '#1F2937',
                    fontSize: '16px'
                  }}
                >
                  Hesaplama Geçmişi
                </Typography>
                
                {calculationHistory.length > 0 ? (
                  <>
                    <Box sx={{ 
                      flex: 1,
                      maxHeight: '450px', 
                      overflowY: 'auto',
                      mb: 2.5,
                      pr: 1
                    }}>
                      <List sx={{ py: 0 }}>
                        {calculationHistory.map((item) => (
                          <ListItem
                            key={item.id}
                            sx={{
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              mb: 1,
                              px: 1.5,
                              py: 1,
                              bgcolor: '#ffffff',
                              minHeight: '56px',
                              '&:hover': {
                                bgcolor: '#f7f8fa',
                                borderColor: '#d1d5db'
                              }
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
                                  '&:hover': {
                                    bgcolor: '#FEE2E2'
                                  }
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
                                    mb: 0.25
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
                                    lineHeight: 1.5
                                  }}
                                >
                                  {item.productionCount} adet • {item.totalWeight.toFixed(2)} gr
                                </Typography>
                              }
                              sx={{ my: 0, '& .MuiListItemText-primary': { mb: 0 }, '& .MuiListItemText-secondary': { mt: 0 } }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                          
                          {/* Toplam Taş Gramı */}
                          <Box sx={{
                            p: 1.5,
                            borderRadius: '10px',
                            bgcolor: '#2563EB',
                            textAlign: 'center',
                            mb: 1.5
                          }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'white', 
                                fontWeight: 500, 
                                fontSize: '0.6875rem',
                                display: 'block',
                                mb: 0.5
                              }}
                            >
                              Toplam Taş Gramı
                            </Typography>
                            <Typography 
                              variant="h6" 
                              fontWeight={700} 
                              sx={{ 
                                color: 'white',
                                fontSize: '1.125rem',
                                lineHeight: 1.2
                              }}
                            >
                              {calculationHistory.reduce((sum, item) => sum + item.totalWeight, 0).toFixed(2)} gr
                            </Typography>
                          </Box>
                          
                          {/* Yazdır Butonu */}
                    <Button
                      variant="contained"
                      startIcon={<PrintIcon />}
                            onClick={handlePrintHistory}
                            fullWidth
                      sx={{
                              bgcolor: '#2563EB',
                        color: 'white',
                              borderRadius: '8px',
                        py: 1,
                              fontSize: '0.8125rem',
                              fontWeight: 500,
                              textTransform: 'none',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        '&:hover': {
                                bgcolor: '#1D4ED8',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }
                      }}
                    >
                      Yazdır
                    </Button>
                        </>
                      ) : (
                        <Box sx={{ 
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#6B7280'
                        }}>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                            Henüz hesaplama eklenmemiş
                          </Typography>
                  </Box>
              )}
                    </CardContent>
                  </Card>
          </Box>

          {/* Taş Listesi - Ayrı Kart */}
          {calculationResult && calculationResult.stoneDetails.length > 0 && (
            <Card sx={{ 
              width: '100%', 
              mt: 3, 
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
              bgcolor: '#ffffff'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 500,
                    color: '#1F2937',
                    fontSize: '1rem'
                  }}
                >
                  Taş Listesi
                </Typography>
                
                <TableContainer 
                  component={Paper} 
                  variant="outlined"
                  sx={{
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    overflow: 'hidden'
                  }}
                >
                  <Table size="medium">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                        <TableCell 
                          sx={{ 
                            fontWeight: 500,
                            color: '#1F2937',
                            fontSize: '0.875rem',
                            borderBottom: '1px solid #E5E7EB'
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
                            borderBottom: '1px solid #E5E7EB'
                          }}
                          width="30%"
                        >
                          Adet
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {calculationResult.stoneDetails.map((detail) => {
                        return (
                          <TableRow 
                            key={detail.stoneId}
                            sx={{
                              '&:hover': {
                                bgcolor: '#F9FAFB'
                              },
                              '&:last-child td': {
                                borderBottom: 'none'
                              }
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
                                borderBottom: '1px solid #E5E7EB'
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
                                borderBottom: '1px solid #E5E7EB'
                              }}
                            >
                              {detail.quantity}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
} 