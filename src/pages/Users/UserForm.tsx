import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserStore } from '../../store/userStore';
import { userService } from '../../services/user.service';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import BackButton from '../../components/common/BackButton';

const UserForm: React.FC = () => {
  const { id } = useParams(); // If id exists, it's Edit mode
  const navigate = useNavigate();
  const { createUser, updateUser } = useUserStore();
  const { t } = useTranslation();
    
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode && id) {
      const fetchUser = async () => {
        setFetching(true);
        try {
          const user = await userService.getById(id);
          setFormData({
            username: user.username,
            email: user.email || '',
            password: '', // Don't fill password on edit
            active: user.active,
          });
        } catch (err) {
          const msg = t('common.error');
          setError(msg); // Fallback or specific error
          toast.error(msg);
        } finally {
            setFetching(false);
        }
      };
      fetchUser();
    }
  }, [id, isEditMode, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    // Handle checkbox (active) state correctly
    const val = type === 'checkbox' ? checked : value;
    
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEditMode && id) {
        // Only include password if provided
        const updateData: any = { ...formData };
        if (!updateData.password) delete updateData.password;
        await updateUser(id, updateData);
        toast.success(t('common.messages.updateSuccess'));
      } else {
        await createUser(formData);
        toast.success(t('common.messages.createSuccess'));
      }
      navigate('/dashboard/users');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || t('common.messages.operationFailed');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
        </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2 }}>
        <BackButton sx={{ color: 'text.secondary' }} />
        <Typography variant="h5" fontWeight="bold">
          {isEditMode ? t('users.editUser') : t('users.addUser')}
        </Typography>
      </Box>

      <Paper elevation={1} sx={{ p: 4 }}>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label={t('auth.username')}
              name="username"
              value={formData.username}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
            />

            <TextField
              label={t('auth.email')}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
            />

            <TextField
              label={isEditMode ? t('users.passwordHint') : t('auth.password')}
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required={!isEditMode}
              variant="outlined"
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label={t('users.activeAccount')}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
              sx={{ mt: 2 }}
            >
              {loading ? t('users.saving') : t('users.saveUser')}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default UserForm;
