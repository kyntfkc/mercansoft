'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Tooltip,
  Chip,
  Stack,
  Pagination,
  TablePagination,
  TableSortLabel,
  OutlinedInput,
  InputAdornment,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useStore } from '../store/useStore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ImageIcon from '@mui/icons-material/Image';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// Kategori seçenekleri
const KATEGORILER = ["Kolye", "Küpe", "Yüzük", "Bileklik", "Üretim Ara Parça"];

interface ModelStone {
  stoneId: string;
  quantity: number;
}

export default function ModelManager() {
  const { models, stones, addModel, updateModel, deleteModel } = useStore();
  const [open, setOpen] = useState(false);
  const [viewModelOpen, setViewModelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [editingModel, setEditingModel] = useState<{
    id?: string;
    name: string;
    stockCode?: string;
    category?: string;
    image?: string;
    stones: ModelStone[];
  }>({
    name: '',
    stockCode: '',
    category: '',
    stones: [],
    image: undefined,
  });
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sürükle bırak için durumları
  const [isDragging, setIsDragging] = useState(false);

  // Taş seçimi ve miktar
  const [selectedStoneId, setSelectedStoneId] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  // Sayfalama durumları
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filtreleme ve arama durumları
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingModel({ 
      name: '', 
      stockCode: '', 
      category: '',
      stones: [], 
      image: undefined 
    });
    setIsEditing(false);
    setSelectedStoneId('');
    setQuantity(1);
  };

  const handleViewModelClose = () => {
    setViewModelOpen(false);
    setSelectedModel(null);
  };

  const handleEditModel = (model: {
    id: string;
    name: string;
    stockCode?: string;
    category?: string;
    image?: string;
    stones: ModelStone[];
  }) => {
    setEditingModel({
      id: model.id,
      name: model.name,
      stockCode: model.stockCode || '',
      category: model.category || '',
      image: model.image,
      stones: [...model.stones],
    });
    setIsEditing(true);
    setOpen(true);
  };

  const handleViewModel = (modelId: string) => {
    setSelectedModel(modelId);
    setViewModelOpen(true);
  };

  const handleSave = async () => {
    if (editingModel.name.trim() === '') {
      return;
    }

    // Boş stringi undefined'a çevir
    const stockCode = editingModel.stockCode?.trim() === '' ? undefined : editingModel.stockCode;
    const category = editingModel.category?.trim() === '' ? undefined : editingModel.category;
    
    if (isEditing && editingModel.id) {
      await updateModel(editingModel.id, {
        name: editingModel.name,
        stockCode: stockCode,
        category: category,
        image: editingModel.image,
        stones: editingModel.stones,
      });
    } else {
      await addModel({
        name: editingModel.name,
        stockCode: stockCode,
        category: category,
        image: editingModel.image,
        stones: editingModel.stones,
      });
    }

    handleClose();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu modeli silmek istediğinize emin misiniz?')) {
      await deleteModel(id);
    }
  };

  const handleAddStone = () => {
    if (!selectedStoneId || quantity <= 0) {
      return;
    }

    // Eğer bu taş zaten eklenmiş ise, miktarını güncelle
    const existingStoneIndex = editingModel.stones.findIndex((s) => s.stoneId === selectedStoneId);
    if (existingStoneIndex !== -1) {
      const updatedStones = [...editingModel.stones];
      updatedStones[existingStoneIndex].quantity += quantity;
      setEditingModel({ ...editingModel, stones: updatedStones });
    } else {
      // Yeni taş ekle
      setEditingModel({
        ...editingModel,
        stones: [...editingModel.stones, { stoneId: selectedStoneId, quantity }],
      });
    }

    // Seçimleri sıfırla
    setSelectedStoneId('');
    setQuantity(1);
  };

  const handleRemoveStone = (stoneIdToRemove: string) => {
    setEditingModel({
      ...editingModel,
      stones: editingModel.stones.filter((stone) => stone.stoneId !== stoneIdToRemove),
    });
  };
  
  // Görsel yükleme işleyicileri
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    processImageFile(file);
  };
  
  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditingModel({
          ...editingModel,
          image: event.target.result as string,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = () => {
    fileInputRef.current?.click();
  };
  
  // Sürükle bırak işleyicileri
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      if (file.type.startsWith('image/')) {
        processImageFile(file);
      }
    }
  };

  // Tek taş ağırlığını hesaplama fonksiyonu
  const calculateSingleStoneWeight = (countPerGram: number | undefined | null): number => {
    if (!countPerGram || countPerGram <= 0 || isNaN(countPerGram)) return 0;
    const weight = 1 / countPerGram;
    return isNaN(weight) ? 0 : weight;
  };
  
  // Sayfalama işleyicileri
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Filtreleme fonksiyonu
  const filteredModels = models.filter(model => {
    // Arama sorgusu kontrolü
    const matchesSearch = searchQuery === '' || 
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.stockCode && model.stockCode.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Kategori filtresi kontrolü
    const matchesCategory = !selectedCategory || 
      (model.category && model.category === selectedCategory);
    
    return matchesSearch && matchesCategory;
  });
  
  // Sayfalanmış modeller
  const paginatedModels = filteredModels.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  // Seçili modelin detayları
  const viewingModel = selectedModel ? models.find((m) => m.id === selectedModel) : null;

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Model Listesi</Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<AddIcon />}
                  onClick={handleOpen}
                  size="small"
                  sx={{ 
                    borderRadius: "18px", 
                    color: 'white',
                    fontWeight: 600
                  }}
                >
                  Yeni Model Ekle
                </Button>
              </Box>
              
              {/* Arama ve Filtreleme Alanı */}
              <Box display="flex" mb={2} gap={1}>
                <TextField
                  placeholder="Model ara..."
                  size="small"
                  variant="outlined"
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<FilterListIcon />}
                  onClick={() => setFilterOpen(!filterOpen)}
                  color="secondary"
                  sx={{
                    borderColor: 'secondary.main',
                    color: 'secondary.dark',
                    '&:hover': {
                      borderColor: 'secondary.dark',
                      backgroundColor: 'rgba(158, 220, 179, 0.08)'
                    }
                  }}
                >
                  Filtre
                </Button>
              </Box>
              
              {/* Filtre Paneli */}
              {filterOpen && (
                <Box mb={2} p={2} bgcolor="background.paper" borderRadius={1} border={1} borderColor="divider">
                  <Typography variant="subtitle2" mb={1}>Kategoriler</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    {KATEGORILER.map(kategori => (
                      <Chip 
                        key={kategori}
                        label={kategori}
                        clickable
                        color={selectedCategory === kategori ? "primary" : "default"}
                        onClick={() => {
                          // Eğer zaten seçiliyse kaldır, değilse seç
                          setSelectedCategory(prev => 
                            prev === kategori ? null : kategori
                          );
                        }}
                        size="small"
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {filteredModels.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  {models.length === 0 
                    ? "Henüz kayıtlı model bulunmamaktadır. Yeni model ekleyerek başlayabilirsiniz."
                    : "Arama kriterlerinize uygun model bulunamadı."}
                </Typography>
              ) : (
                <>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Görsel</TableCell>
                          <TableCell>Model Adı</TableCell>
                          <TableCell>Stok Kodu</TableCell>
                          <TableCell>Kategori</TableCell>
                          <TableCell align="right">Toplam Taş</TableCell>
                          <TableCell align="right">İşlemler</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedModels.map((model) => {
                          const totalStones = model.stones.reduce((sum, stone) => sum + stone.quantity, 0);
                          
                          return (
                            <TableRow key={model.id}>
                              <TableCell>
                                {model.image ? (
                                  <Box
                                    component="img"
                                    src={model.image}
                                    alt={model.name}
                                    sx={{ 
                                      width: 40, 
                                      height: 40, 
                                      objectFit: 'contain',
                                      borderRadius: 1,
                                      border: '1px solid',
                                      borderColor: 'divider'
                                    }}
                                  />
                                ) : (
                                  <Box
                                    sx={{ 
                                      width: 40, 
                                      height: 40, 
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      bgcolor: 'grey.100',
                                      borderRadius: 1,
                                      border: '1px dashed',
                                      borderColor: 'divider'
                                    }}
                                  >
                                    <ImageIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                                  </Box>
                                )}
                              </TableCell>
                              <TableCell>{model.name}</TableCell>
                              <TableCell>{model.stockCode || '-'}</TableCell>
                              <TableCell>{model.category || '-'}</TableCell>
                              <TableCell align="right">{totalStones}</TableCell>
                              <TableCell align="right">
                                <Tooltip title="Görüntüle">
                                  <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => handleViewModel(model.id)}
                                  >
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Düzenle">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleEditModel(model)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Sil">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDelete(model.id)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <TablePagination
                    component="div"
                    count={filteredModels.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                    labelRowsPerPage="Sayfa başına model:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Model Ekleme/Düzenleme Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Model Düzenle' : 'Yeni Model Ekle'}</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={7}>
              <TextField
                autoFocus
                margin="dense"
                label="Model Adı"
                fullWidth
                variant="outlined"
                size="small"
                value={editingModel.name}
                onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })}
              />

              <TextField
                margin="dense"
                label="Stok Kodu"
                fullWidth
                size="small"
                variant="outlined"
                value={editingModel.stockCode || ''}
                onChange={(e) => setEditingModel({ ...editingModel, stockCode: e.target.value })}
              />
              
              <FormControl fullWidth margin="dense" size="small">
                <InputLabel id="category-select-label">Kategori</InputLabel>
                <Select
                  labelId="category-select-label"
                  value={editingModel.category || ''}
                  label="Kategori"
                  onChange={(e) => setEditingModel({ ...editingModel, category: e.target.value })}
                >
                  <MenuItem value="">
                    <em>Seçilmedi</em>
                  </MenuItem>
                  {KATEGORILER.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={5}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed',
                  borderColor: isDragging ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  p: 1,
                  mt: 0.5,
                  height: '140px',
                  bgcolor: isDragging ? 'rgba(0, 0, 255, 0.05)' : 'transparent',
                  cursor: 'pointer'
                }}
                onClick={handleImageSelect}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {editingModel.image ? (
                  <Box
                    component="img"
                    src={editingModel.image}
                    alt="Model Görseli"
                    sx={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain' }}
                  />
                ) : (
                  <>
                    <CloudUploadIcon sx={{ fontSize: 30, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                      Görsel Eklemek İçin Tıklayın
                    </Typography>
                  </>
                )}
              </Box>
              <Button
                variant="outlined"
                startIcon={<ImageIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageSelect();
                }}
                size="small"
                sx={{ mt: 1, width: '100%' }}
              >
                {editingModel.image ? 'Değiştir' : 'Görsel Ekle'}
              </Button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Taşlar
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="stone-select-label">Taş</InputLabel>
                <Select
                  labelId="stone-select-label"
                  value={selectedStoneId}
                  label="Taş"
                  onChange={(e) => setSelectedStoneId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Seçiniz</em>
                  </MenuItem>
                  {stones.map((stone) => (
                    <MenuItem key={stone.id} value={stone.id}>
                      {stone.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Adet"
                type="text"
                size="small"
                sx={{ width: 120 }}
                value={quantity > 0 ? quantity : ''}
                onChange={(e) => {
                  // Sadece sayı girişine izin ver
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setQuantity(value ? parseInt(value) : 0);
                }}
                inputProps={{ 
                  min: 1,
                  style: { textAlign: 'center' },
                  // Sayı inputu oklarını kaldır
                  inputMode: 'numeric',
                  pattern: '[0-9]*'
                }}
              />
              <Button variant="contained" size="small" color="secondary" onClick={handleAddStone}>
                Ekle
              </Button>
            </Box>

            {editingModel.stones && editingModel.stones.length > 0 ? (
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 1, maxHeight: '180px' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Taş Adı</TableCell>
                      <TableCell align="center">Adet</TableCell>
                      <TableCell align="center">İşlem</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {editingModel.stones.map((modelStone, index) => {
                      const stone = stones.find(s => s.id === modelStone.stoneId);
                      return (
                        <TableRow key={`${modelStone.stoneId}-${index}`}>
                          <TableCell component="th" scope="row">
                            {stone ? stone.name : 'Bilinmeyen Taş'}
                          </TableCell>
                          <TableCell align="center">{modelStone.quantity}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveStone(modelStone.stoneId)}
                              color="error"
                              aria-label="sil"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2, textAlign: 'center' }}>
                Henüz taş eklenmemiş
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit" size="small">İptal</Button>
          <Button onClick={handleSave} variant="contained" color="primary" size="small">
            {isEditing ? 'Güncelle' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Model Detay Görüntüleme Dialog */}
      <Dialog open={viewModelOpen} onClose={handleViewModelClose} maxWidth="md" fullWidth>
        <DialogTitle>Model Detayı</DialogTitle>
        <DialogContent>
          {viewingModel && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" gutterBottom>
                  {viewingModel.name}
                </Typography>
                {viewingModel.stockCode && (
                  <Typography variant="body2" color="text.secondary">
                    Stok Kodu: {viewingModel.stockCode}
                  </Typography>
                )}
                {viewingModel.category && (
                  <Typography variant="body2" color="text.secondary">
                    Kategori: {viewingModel.category}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" paragraph>
                  Model ID: {viewingModel.id}
                </Typography>

                <Typography variant="subtitle2" gutterBottom>
                  Taşlar:
                </Typography>
                {viewingModel.stones.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Taş</TableCell>
                          <TableCell align="right">Adet</TableCell>
                          <TableCell align="right">Birim Ağırlık</TableCell>
                          <TableCell align="right">Toplam Ağırlık</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewingModel.stones.map((modelStone) => {
                          const stone = stones.find((s) => s.id === modelStone.stoneId);
                          if (!stone) {
                            console.warn('Model detayında taş bulunamadı:', {
                              stoneId: modelStone.stoneId,
                              availableStones: stones.length,
                              stoneIds: stones.map(s => s.id).slice(0, 5)
                            });
                          } else if (!stone.countPerGram || stone.countPerGram === 0) {
                            console.warn('Taş countPerGram değeri geçersiz:', {
                              stoneId: stone.id,
                              stoneName: stone.name,
                              countPerGram: stone.countPerGram
                            });
                          }
                          const singleWeight = stone ? calculateSingleStoneWeight(stone.countPerGram) : 0;
                          const totalWeight = singleWeight * modelStone.quantity;
                          return (
                            <TableRow key={modelStone.stoneId}>
                              <TableCell>{stone?.name || 'Bilinmeyen Taş'}</TableCell>
                              <TableCell align="right">{modelStone.quantity}</TableCell>
                              <TableCell align="right">
                                {isNaN(singleWeight) ? '0.000000' : singleWeight.toFixed(6)} gr
                              </TableCell>
                              <TableCell align="right">
                                {isNaN(totalWeight) ? '0.0000' : totalWeight.toFixed(4)} gr
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    Bu modelde taş bulunmuyor.
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                {viewingModel.image ? (
                  <Card>
                    <CardMedia
                      component="img"
                      sx={{ maxHeight: 300, objectFit: 'contain' }}
                      image={viewingModel.image}
                      alt={viewingModel.name}
                    />
                  </Card>
                ) : (
                  <Box
                    sx={{
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(0,0,0,0.05)',
                      borderRadius: 1,
                    }}
                  >
                    <Typography color="text.secondary">Görsel mevcut değil</Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViewModelClose}>Kapat</Button>
          {viewingModel && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                handleViewModelClose();
                handleEditModel(viewingModel);
              }}
            >
              Düzenle
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
} 