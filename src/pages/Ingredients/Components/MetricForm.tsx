
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
import type { CreateMetricDto, Metric } from '../../../services/metric.service';
import { useTranslation } from 'react-i18next';

interface MetricFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMetricDto) => void;
  initialData?: Metric | null;
  loading?: boolean;
}

const MetricForm: React.FC<MetricFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
}) => {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateMetricDto>();

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          title: initialData.title,
          abbrv: initialData.abbrv,
        });
      } else {
        reset({
          title: '',
          abbrv: '',
        });
      }
    }
  }, [initialData, open, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          {initialData ? t('common.edit') : t('common.create')} {t('metrics.entity', 'Metric')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label={t('metrics.form.title', 'Title')}
              fullWidth
              {...register('title', { required: t('validation.required') })}
              error={!!errors.title}
              helperText={errors.title?.message}
            />
            <TextField
              label={t('metrics.form.abbrv', 'Abbreviation')}
              fullWidth
              {...register('abbrv', { required: t('validation.required') })}
              error={!!errors.abbrv}
              helperText={errors.abbrv?.message}
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

export default MetricForm;
