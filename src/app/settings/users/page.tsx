'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import { usersAPI, User } from '../../../lib/api';
import { useAuthStore } from '../../../store/useAuthStore';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease',
  borderRadius: theme.spacing(1.5),
  boxShadow: '0 6px 10px rgba(0,0,0,0.08)',
}));

export default function UsersSettings() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (error: any) {
      showSnackbar(error.message || 'Kullanıcılar yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ username: user.username, password: '' });
    } else {
      setEditingUser(null);
      setFormData({ username: '', password: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormData({ username: '', password: '' });
  };

  const handleSave = async () => {
    try {
      if (!formData.username.trim()) {
        showSnackbar('Kullanıcı adı gereklidir', 'error');
        return;
      }

      if (editingUser) {
        // Güncelleme
        const updateData: { username?: string; password?: string } = {};
        if (formData.username !== editingUser.username) {
          updateData.username = formData.username.trim();
        }
        if (formData.password) {
          updateData.password = formData.password;
        }

        if (Object.keys(updateData).length === 0) {
          showSnackbar('Değişiklik yapılmadı', 'error');
          return;
        }

        await usersAPI.update(editingUser.id, updateData);
        showSnackbar('Kullanıcı güncellendi', 'success');
      } else {
        // Yeni kullanıcı
        if (!formData.password) {
          showSnackbar('Şifre gereklidir', 'error');
          return;
        }
        await usersAPI.create({
          username: formData.username.trim(),
          password: formData.password,
        });
        showSnackbar('Kullanıcı oluşturuldu', 'success');
      }

      handleCloseDialog();
      loadUsers();
    } catch (error: any) {
      showSnackbar(error.message || 'İşlem başarısız oldu', 'error');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await usersAPI.delete(userId);
      showSnackbar('Kullanıcı silindi', 'success');
      loadUsers();
    } catch (error: any) {
      showSnackbar(error.message || 'Kullanıcı silinirken hata oluştu', 'error');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.back()} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={600}>
          Kullanıcı Yönetimi
        </Typography>
      </Box>

      <StyledCard>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" color="text.secondary">
              Kullanıcılar ({users.length})
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Yeni Kullanıcı
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Kullanıcı Adı</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Oluşturulma Tarihi</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      İşlemler
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          Henüz kullanıcı bulunmuyor
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography fontWeight={user.id === currentUser?.id ? 600 : 400}>
                              {user.username}
                              {user.id === currentUser?.id && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{ ml: 1, color: 'primary.main' }}
                                >
                                  (Siz)
                                </Typography>
                              )}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Düzenle">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(user)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {user.id !== currentUser?.id && (
                            <Tooltip title="Sil">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(user.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </StyledCard>

      {/* Kullanıcı Ekleme/Düzenleme Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {editingUser ? <EditIcon /> : <AddIcon />}
            {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              label="Kullanıcı Adı"
              fullWidth
              margin="normal"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
            <TextField
              label={editingUser ? 'Yeni Şifre (boş bırakılırsa değişmez)' : 'Şifre'}
              type="password"
              fullWidth
              margin="normal"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
              helperText={
                editingUser
                  ? 'Şifreyi değiştirmek istemiyorsanız boş bırakın'
                  : 'Şifre en az 6 karakter olmalıdır'
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>İptal</Button>
          <Button variant="contained" onClick={handleSave} startIcon={<LockIcon />}>
            {editingUser ? 'Güncelle' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

