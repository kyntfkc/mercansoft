'use client';

import { useState } from 'react';
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
  Tooltip,
} from '@mui/material';
import { useStore } from '../store/useStore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

interface StoneSetStone {
  stoneId: string;
  quantity: number;
}

export default function StoneSetManager() {
  const { stones, stoneSets, addStoneSet, updateStoneSet, deleteStoneSet } = useStore();
  const [open, setOpen] = useState(false);
  const [editingStoneSet, setEditingStoneSet] = useState<{
    id?: string;
    name: string;
    stones: StoneSetStone[];
  }>({
    name: '',
    stones: [],
  });
  const [isEditing, setIsEditing] = useState(false);

  // Taş seçimi ve miktar
  const [selectedStoneId, setSelectedStoneId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingStoneSet({ name: '', stones: [] });
    setIsEditing(false);
    setSelectedStoneId('');
    setQuantity(1);
  };

  const handleEditStoneSet = (stoneSet: {
    id: string;
    name: string;
    stones: StoneSetStone[];
  }) => {
    setEditingStoneSet({
      id: stoneSet.id,
      name: stoneSet.name,
      stones: [...stoneSet.stones],
    });
    setIsEditing(true);
    setOpen(true);
  };

  const handleSave = async () => {
    if (editingStoneSet.name.trim() === '') {
      return;
    }

    if (isEditing && editingStoneSet.id) {
      await updateStoneSet(editingStoneSet.id, {
        name: editingStoneSet.name,
        stones: editingStoneSet.stones,
      });
    } else {
      await addStoneSet({
        name: editingStoneSet.name,
        stones: editingStoneSet.stones,
      });
    }

    handleClose();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu taş setini silmek istediğinize emin misiniz?')) {
      await deleteStoneSet(id);
    }
  };

  const handleAddStone = () => {
    if (!selectedStoneId || quantity <= 0) {
      return;
    }

    // Eğer bu taş zaten eklenmiş ise, miktarını güncelle
    const existingStoneIndex = editingStoneSet.stones.findIndex((s) => s.stoneId === selectedStoneId);
    if (existingStoneIndex !== -1) {
      const updatedStones = [...editingStoneSet.stones];
      updatedStones[existingStoneIndex].quantity += quantity;
      setEditingStoneSet({ ...editingStoneSet, stones: updatedStones });
    } else {
      // Yeni taş ekle
      setEditingStoneSet({
        ...editingStoneSet,
        stones: [...editingStoneSet.stones, { stoneId: selectedStoneId, quantity }],
      });
    }

    // Seçimleri sıfırla
    setSelectedStoneId('');
    setQuantity(1);
  };

  const handleRemoveStone = (stoneIdToRemove: string) => {
    setEditingStoneSet({
      ...editingStoneSet,
      stones: editingStoneSet.stones.filter((stone) => stone.stoneId !== stoneIdToRemove),
    });
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Taş Setleri</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpen}
                >
                  Yeni Set Ekle
                </Button>
              </Box>

              <Typography color="text.secondary" mb={2}>
                Taş setleri, sık kullanılan taş kombinasyonlarını kolayca yönetmenizi sağlar.
                Model eklerken bu setleri kullanabilirsiniz.
              </Typography>

              {stoneSets.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  Henüz kayıtlı taş seti bulunmamaktadır. Yeni set ekleyerek başlayabilirsiniz.
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Set Adı</TableCell>
                        <TableCell>Taş Sayısı</TableCell>
                        <TableCell align="right">İşlemler</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stoneSets.map((stoneSet) => (
                        <TableRow key={stoneSet.id}>
                          <TableCell>{stoneSet.name}</TableCell>
                          <TableCell>{stoneSet.stones.length}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="Düzenle">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEditStoneSet(stoneSet)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Sil">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(stoneSet.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Taş Seti Ekleme/Düzenleme Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Taş Seti Düzenle' : 'Yeni Taş Seti Ekle'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Set Adı"
            fullWidth
            variant="outlined"
            value={editingStoneSet.name}
            onChange={(e) => setEditingStoneSet({ ...editingStoneSet, name: e.target.value })}
          />

          <Box sx={{ my: 2 }}>
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
                      {stone.name} ({(1 / stone.countPerGram).toFixed(4)} gr)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Adet"
                type="number"
                size="small"
                sx={{ width: 100 }}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                inputProps={{ min: 1 }}
              />
              <Button variant="contained" size="small" onClick={handleAddStone}>
                Ekle
              </Button>
            </Box>

            {editingStoneSet.stones.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Taş</TableCell>
                      <TableCell align="right">Adet</TableCell>
                      <TableCell align="right">İşlem</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {editingStoneSet.stones.map((stoneSetStone) => {
                      const stone = stones.find((s) => s.id === stoneSetStone.stoneId);
                      return (
                        <TableRow key={stoneSetStone.stoneId}>
                          <TableCell>{stone?.name || 'Bilinmeyen Taş'}</TableCell>
                          <TableCell align="right">{stoneSetStone.quantity}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveStone(stoneSetStone.stoneId)}
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
              <Typography color="text.secondary" variant="body2" textAlign="center" py={2}>
                Henüz taş eklenmedi.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>İptal</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 