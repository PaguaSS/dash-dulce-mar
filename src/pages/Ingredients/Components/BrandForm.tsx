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
import type { CreateBrandDto, Brand } from '../../../services/brand.service';
import { useTranslation } from 'react-i18next';

interface BrandFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBrandDto) => void;
  initialData?: Brand | null;
  loading?: boolean;
}

const BrandForm: React.FC<BrandFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
}) => {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateBrandDto>();

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({ name: initialData.name });
      } else {
        reset({ name: '' });
      }
    }
  }, [initialData, open, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          {initialData ? t('common.edit') : t('common.create')} {t('brands.entity', 'Brand')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label={t('brands.form.name', 'Name')}
              fullWidth
              {...register('name', { required: t('validation.required') })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={loading} autoFocus>
            {loading ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BrandForm;
