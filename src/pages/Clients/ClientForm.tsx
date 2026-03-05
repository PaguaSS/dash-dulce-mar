import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import type { CreateClientDto, Client } from '../../services/client.service';
import { useTranslation } from 'react-i18next';

interface ClientFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateClientDto) => void;
  initialData?: Client | null;
  loading?: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
}) => {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateClientDto>();

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          lastname: initialData.lastname || '',
          phone: initialData.phone || '',
          email: initialData.email || '',
        });
      } else {
        reset({
          name: '',
          lastname: '',
          phone: '',
          email: '',
        });
      }
    }
  }, [initialData, open, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          {initialData ? t('common.edit') : t('common.create')} {t('clients.entity')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label={t('clients.form.name')}
              fullWidth
              {...register('name', { required: t('validation.required') })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              label={t('clients.form.lastname')}
              fullWidth
              {...register('lastname')}
            />
            <TextField
              label={t('clients.form.phone')}
              fullWidth
              {...register('phone')}
            />
            <TextField
              label={t('clients.form.email')}
              type="email"
              fullWidth
              {...register('email')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ClientForm;
