'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { authAPI } from '../../lib/api';
import { DEFAULT_LOGO, resolveLogoUrl } from '../../lib/logo';
import { useAuthStore } from '../../store/useAuthStore';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string>(DEFAULT_LOGO);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  // Daha önce kaydedildiyse (Firma Ayarları) giriş ekranında da logo göster
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('companySettings');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed?.logo && String(parsed.logo).trim() !== '') {
        setCompanyLogo(resolveLogoUrl(parsed.logo));
      }
    } catch (e) {
      console.warn('Logo yüklenemedi:', e);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authAPI.login(username.trim(), password);
      login(response);
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız oldu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f7fb',
        px: 2,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          maxWidth: 420,
          width: '100%',
          p: 4,
          borderRadius: 3,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            component="img"
            src={companyLogo}
            alt="Firma Logosu"
            sx={{
              height: 58,
              maxWidth: 260,
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
              mx: 'auto',
              mb: 2,
              filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.12))',
            }}
            onError={() => setCompanyLogo(DEFAULT_LOGO)}
          />
          <Typography variant="h5" fontWeight={600}>
            Giriş
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lütfen kullanıcı adı ve şifrenizi girin
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Kullanıcı Adı"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <TextField
            label="Şifre"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Giriş Yap'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

