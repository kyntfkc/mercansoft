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
import { DEFAULT_LOGO, BRAND_LOGO_SX } from '../../lib/logo';
import { useAuthStore } from '../../store/useAuthStore';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

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
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #f8fafc, rgba(239,246,255,0.3), rgba(238,242,255,0.5))',
        px: 2,
        py: 4,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          width: '100%',
          maxWidth: 420,
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Box
            component="img"
            src={DEFAULT_LOGO}
            alt="indigo"
            sx={{ ...BRAND_LOGO_SX, mx: 'auto' }}
          />
          <Typography
            sx={{
              mt: 1,
              color: '#64748B',
              fontSize: '0.875rem',
            }}
          >
            indigo | Taş Hesaplama Sistemi
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            width: '100%',
            p: 4,
            borderRadius: 3,
            bgcolor: '#ffffff',
            boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
          }}
        >
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5, color: '#0f172a' }}>
            Giriş yap
          </Typography>
          <Typography variant="body2" sx={{ mb: 2.5, color: '#64748B' }}>
            Hesaplamayı kullanmak için oturum açın
          </Typography>

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
              fullWidth
              size="large"
              sx={{
                mt: 2,
                bgcolor: '#0f172a',
                color: '#fff',
                textTransform: 'none',
                fontWeight: 600,
                py: 1.25,
                borderRadius: 2,
                '&:hover': { bgcolor: '#1e293b' },
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Giriş yap'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
