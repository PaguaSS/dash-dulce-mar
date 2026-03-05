import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Divider,
} from '@mui/material';
import { calculatorParamsService, type CalculatorParams } from '../services/calculatorParams.service';
import { appConfigService, type InvoiceParams } from '../services/app-config.service';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

interface CalculatorParamsDialogProps {
  open: boolean;
  onClose: () => void;
}

const CalculatorParamsDialog: React.FC<CalculatorParamsDialogProps> = ({
  open,
  onClose,
}) => {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CalculatorParams & InvoiceParams>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchParams = async () => {
        setFetching(true);
        try {
          const [calcData, invData] = await Promise.all([
            calculatorParamsService.get(),
            appConfigService.getInvoiceParams()
          ]);
          reset({ ...calcData, ...invData });
        } catch (error) {
          console.error('Failed to fetch calculator params', error);
          toast.error(t('common.errorLoading'));
        } finally {
          setFetching(false);
        }
      };
      fetchParams();
    }
  }, [open, reset, t]);

  const onSubmit = async (data: CalculatorParams & InvoiceParams) => {
    setLoading(true);
    try {
      const { businessName, location, phone, ...calcParams } = data;
      await Promise.all([
        calculatorParamsService.update(calcParams),
        appConfigService.updateInvoiceParams({ businessName, location, phone })
      ]);
      toast.success(t('common.updateSuccess'));
      onClose();
    } catch (error) {
      console.error('Failed to update params', error);
      toast.error(t('common.updateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{t('calculatorParams.title')}</DialogTitle>
        <DialogContent>
          {fetching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label={t('calculatorParams.gasPricePerLt')}
                type="number"
                fullWidth
                {...register('gasPricePerLt', { valueAsNumber: true, required: t('validation.required') })}
                error={!!errors.gasPricePerLt}
                helperText={errors.gasPricePerLt?.message}
                slotProps={{ htmlInput: { step: "0.01" } }}
              />
              <TextField
                label={t('calculatorParams.averageKmPerLitre')}
                type="number"
                fullWidth
                {...register('averageKmPerLitre', { valueAsNumber: true, required: t('validation.required') })}
                error={!!errors.averageKmPerLitre}
                helperText={errors.averageKmPerLitre?.message}
                slotProps={{ htmlInput: { step: "0.01" } }}
              />
              <TextField
                label={t('calculatorParams.bakerPayPerHour')}
                type="number"
                fullWidth
                {...register('bakerPayPerHour', { valueAsNumber: true, required: t('validation.required') })}
                error={!!errors.bakerPayPerHour}
                helperText={errors.bakerPayPerHour?.message}
                slotProps={{ htmlInput: { step: "0.01" } }}
              />
              <TextField
                label={t('calculatorParams.driverPayPerHour')}
                type="number"
                fullWidth
                {...register('driverPayPerHour', { valueAsNumber: true, required: t('validation.required') })}
                error={!!errors.driverPayPerHour}
                helperText={errors.driverPayPerHour?.message}
                slotProps={{ htmlInput: { step: "0.01" } }}
              />
              <TextField
                label={t('calculatorParams.waterPricePerLitre')}
                type="number"
                fullWidth
                {...register('waterPricePerLitre', { valueAsNumber: true, required: t('validation.required') })}
                error={!!errors.waterPricePerLitre}
                helperText={errors.waterPricePerLitre?.message}
                slotProps={{ htmlInput: { step: "0.01" } }}
              />
              <TextField
                label={t('calculatorParams.bakePricePerMin')}
                type="number"
                fullWidth
                {...register('bakePricePerMin', { valueAsNumber: true, required: t('validation.required') })}
                error={!!errors.bakePricePerMin}
                helperText={errors.bakePricePerMin?.message}
                slotProps={{ htmlInput: { step: "0.01" } }}
              />
              <TextField
                label={t('calculatorParams.crFee')}
                type="number"
                fullWidth
                {...register('crFee', { valueAsNumber: true, required: t('validation.required') })}
                error={!!errors.crFee}
                helperText={errors.crFee?.message}
                slotProps={{ htmlInput: { step: "0.01" } }}
              />

              <Divider sx={{ my: 1 }}>{t('accounting.form.details')}</Divider>

              <TextField
                label={t('calculatorParams.businessName')}
                fullWidth
                {...register('businessName', { required: t('validation.required') })}
                error={!!errors.businessName}
                helperText={errors.businessName?.message}
              />
              <TextField
                label={t('calculatorParams.location')}
                fullWidth
                {...register('location', { required: t('validation.required') })}
                error={!!errors.location}
                helperText={errors.location?.message}
              />
              <TextField
                label={t('calculatorParams.phone')}
                fullWidth
                {...register('phone', { required: t('validation.required') })}
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={loading || fetching} autoFocus>
            {loading ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CalculatorParamsDialog;
