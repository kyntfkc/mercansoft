'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
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
  TablePagination
} from '@mui/material';
import { useStore } from '../store/useStore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

export default function StoneManager() {
  const { stones, addStone, updateStone, deleteStone } = useStore();
  const [open, setOpen] = useState(false);
  const [editingStone, setEditingStone] = useState<{ id?: string; name: string; countPerGram: number }>({
    name: '',
    countPerGram: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  
  // Sayfalama için state'ler
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingStone({ name: '', countPerGram: 0 });
    setIsEditing(false);
  };

  const handleEditStone = (stone: { id: string; name: string; countPerGram: number }) => {
    setEditingStone(stone);
    setIsEditing(true);
    setOpen(true);
  };

  const handleSave = async () => {
    if (editingStone.name.trim() === '') {
      return;
    }

    if (isEditing && editingStone.id) {
      await updateStone(editingStone.id, {
        name: editingStone.name,
        countPerGram: editingStone.countPerGram,
      });
    } else {
      await addStone({
        name: editingStone.name,
        countPerGram: editingStone.countPerGram,
      });
    }

    handleClose();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu taşı silmek istediğinize emin misiniz?')) {
      await deleteStone(id);
    }
  };

  // Tek taş ağırlığını hesaplama fonksiyonu
  const calculateSingleStoneWeight = (countPerGram: number): number => {
    if (countPerGram <= 0) return 0;
    return 1 / countPerGram;
  };

  // Sayfalama işlemleri için handler'lar
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Mevcut sayfada gösterilecek taş listesi
  const paginatedStones = stones.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <Card sx={{ mb: 2, maxWidth: '450px', width: '100%' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body1" fontWeight={500}>
              Taş Listesi
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={handleOpen}
              size="small"
              sx={{ 
                borderRadius: '20px', 
                px: 2,
                color: 'white',
                fontWeight: 600
              }}
            >
              Yeni Taş Ekle
            </Button>
          </Box>

          {stones.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              Henüz kayıtlı taş bulunmamaktadır. Yeni taş ekleyerek başlayabilirsiniz.
            </Typography>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="50%">Taş Adı</TableCell>
                      <TableCell align="right">1g Adedi</TableCell>
                      <TableCell align="right">İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedStones.map((stone) => (
                      <TableRow key={stone.id}>
                        <TableCell sx={{ 
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 0 
                        }}>
                          {stone.name}
                        </TableCell>
                        <TableCell align="right">{stone.countPerGram}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Düzenle">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditStone(stone)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Sil">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(stone.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                component="div"
                count={stones.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
                labelRowsPerPage="Sayfa başına taş:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Taş Ekleme/Düzenleme Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Taş Düzenle' : 'Yeni Taş Ekle'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Taş Adı"
            fullWidth
            variant="outlined"
            value={editingStone.name}
            onChange={(e) => setEditingStone({ ...editingStone, name: e.target.value })}
            size="small"
          />
          <TextField
            margin="dense"
            label="1 Gramda Adet"
            fullWidth
            variant="outlined"
            type="number"
            inputProps={{ min: 1 }}
            value={editingStone.countPerGram}
            onChange={(e) =>
              setEditingStone({ ...editingStone, countPerGram: parseInt(e.target.value) || 0 })
            }
            helperText="1 gram ağırlıkta kaç adet taş olduğu (örn: 100 adet/gr)"
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} size="small">İptal</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="secondary" 
            size="small" 
            sx={{ 
              borderRadius: '20px',
              color: 'white',
              fontWeight: 600
            }}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 