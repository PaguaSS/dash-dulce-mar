import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { t } = useTranslation();
  
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(credentials);
      if (data?.user && data?.accessToken && data?.refreshToken) {
        setAuth(data.user, data.accessToken, data.refreshToken);
        // enqueueSnackbar(t('common.messages.loginSuccess'), { variant: 'success' }); // Optional, maybe too noisy
        navigate('/dashboard');
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || t('auth.loginFailed');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vw',
        height: '100vh',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 5,
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Box sx={{ mb: 3, width: 80, height: 80 }}>
          <img
            src="/logo-small.png"
            alt={t('common.logoAlt')}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </Box>

        <Typography variant="h5" component="h2" sx={{ mb: 4, fontWeight: 700, color: 'text.primary' }}>
          Dulce Mar <Box component="span" sx={{ color: 'secondary.main' }}>{t('common.admin')}</Box>
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, width: '100%' }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            label={t('auth.username')}
            name="username"
            value={credentials.username}
            onChange={handleInputChange}
            fullWidth
            required
            variant="outlined"
            margin="normal"
            sx={{ mb: 2 }}
          />
            
          <TextField
            label={t('auth.password')}
            name="password"
            type="password"
            value={credentials.password}
            onChange={handleInputChange}
            fullWidth
            required
            variant="outlined"
            margin="normal"
            sx={{ mb: 4 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? t('common.loading') : t('auth.signIn')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
