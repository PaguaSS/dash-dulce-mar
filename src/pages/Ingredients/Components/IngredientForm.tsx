import React, { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  MenuItem,
  CircularProgress,
  InputAdornment,
  ToggleButton,
  IconButton,
  Tooltip,
  Autocomplete,
  createFilterOptions,
} from '@mui/material';
import { Check, RefreshCw } from 'lucide-react';
import type { CreateIngredientDto, Ingredient } from '../../../services/ingredient.service';
import { metricService, type Metric } from '../../../services/metric.service';
import { brandService, type Brand } from '../../../services/brand.service';
import { aiService } from '../../../services/ai.service';
import { useTranslation } from 'react-i18next';

interface BrandOption extends Brand {
  inputValue?: string;
}

const filter = createFilterOptions<BrandOption>();

interface IngredientFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateIngredientDto) => void;
  initialData?: Ingredient | null;
  loading?: boolean;
}

const IngredientForm: React.FC<IngredientFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
}) => {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<CreateIngredientDto>();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<BrandOption | null>(null);
  const [converting, setConverting] = useState(false);
  const [conversionFailed, setConversionFailed] = useState(false);

  const isPackagePrice = watch('isPackagePrice');
  const packagePrice = watch('packagePrice');
  const packageQty = watch('packageQty');
  const packageMetricId = watch('packageMetricId');
  const metricId = watch('metricId');

  const convertPrice = useCallback(async () => {
    if (!packagePrice || !packageQty || !packageMetricId || !metricId || packageQty <= 0) {
      return;
    }

    const packageMetric = metrics.find(m => m.id === packageMetricId);
    const targetMetric = metrics.find(m => m.id === metricId);

    if (!packageMetric || !targetMetric) {
      return;
    }

    const text = `${packagePrice} for ${packageQty} ${packageMetric.title} to ${targetMetric.title}`;

    setConverting(true);
    setConversionFailed(false);
    try {
      const result = await aiService.convert({
        text,
        metrics: [
          { id: packageMetric.id, title: packageMetric.title },
          { id: targetMetric.id, title: targetMetric.title }
        ]
      });

      if (result.unitPrice !== null) {
        setValue('price', parseFloat(result.unitPrice.toFixed(4)));
      } else {
        setConversionFailed(true);
      }
    } catch (error) {
      console.error('AI conversion failed', error);
      setConversionFailed(true);
    } finally {
      setConverting(false);
    }
  }, [packagePrice, packageQty, packageMetricId, metricId, metrics, setValue]);

  useEffect(() => {
    if (isPackagePrice && packagePrice && packageQty && packageMetricId && metricId) {
      const debounce = setTimeout(() => {
        convertPrice();
      }, 500);
      return () => clearTimeout(debounce);
    }
  }, [isPackagePrice, packagePrice, packageQty, packageMetricId, metricId, convertPrice]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, brandsRes] = await Promise.all([
          metricService.getAll(1, 100),
          brandService.getAll(1, 100)
        ]);
        setMetrics(metricsRes.data);
        setBrands(brandsRes.data);
      } catch (error) {
        console.error('Failed to fetch data', error);
      }
    };
    if (open) {
      fetchData();
    }
  }, [open]);

  const handleBrandChange = async (_event: React.SyntheticEvent, newValue: BrandOption | string | null) => {
    if (typeof newValue === 'string') {
      // User typed and pressed enter
      try {
        const created = await brandService.create({ name: newValue });
        setBrands(prev => [...prev, created]);
        setSelectedBrand(created);
        setValue('brandId', created.id);
      } catch (error) {
        console.error('Failed to create brand', error);
      }
    } else if (newValue && newValue.inputValue) {
      // User selected "Add ..." option
      try {
        const created = await brandService.create({ name: newValue.inputValue });
        setBrands(prev => [...prev, created]);
        setSelectedBrand(created);
        setValue('brandId', created.id);
      } catch (error) {
        console.error('Failed to create brand', error);
      }
    } else {
      setSelectedBrand(newValue);
      setValue('brandId', newValue?.id || null);
    }
  };

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Find the metric ID from abbreviation string (packageMetric is stored as "kg", etc.)
        let packageMetricIdValue = '';
        if (initialData.packageMetric && metrics.length > 0) {
          const matchingMetric = metrics.find(m => m.abbrv === initialData.packageMetric);
          packageMetricIdValue = matchingMetric?.id || '';
        }

        reset({
          name: initialData.name,
          price: Number(initialData.price),
          metricId: initialData.metricId || initialData.metric?.id,
          brandId: initialData.brandId || initialData.brand?.id || null,
          isPackagePrice: initialData.isPackagePrice ?? false,
          packagePrice: initialData.packagePrice ? Number(initialData.packagePrice) : 0,
          packageQty: initialData.packageQty ? Number(initialData.packageQty) : 0,
          packageMetricId: packageMetricIdValue,
        });
        setSelectedBrand(initialData.brand as BrandOption || null);
      } else {
        reset({
          name: '',
          price: 0,
          metricId: '',
          brandId: null,
          isPackagePrice: false,
          packagePrice: 0,
          packageQty: 0,
          packageMetricId: '',
        });
        setSelectedBrand(null);
      }
    }
  }, [initialData, open, reset, metrics]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          {initialData ? t('common.edit') : t('common.create')} {t('ingredients.entity', 'Ingredient')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label={t('ingredients.form.name', 'Name')}
              fullWidth
              {...register('name', { required: t('validation.required') })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />

            <Autocomplete
              value={selectedBrand}
              onChange={handleBrandChange}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);
                const { inputValue } = params;
                const isExisting = options.some((option) => inputValue === option.name);
                if (inputValue !== '' && !isExisting) {
                  filtered.push({
                    inputValue,
                    name: `${t('common.add')} "${inputValue}"`,
                    id: '',
                    createdAt: '',
                    updatedAt: '',
                  });
                }
                return filtered;
              }}
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              options={brands}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                if ((option as BrandOption).inputValue) return (option as BrandOption).inputValue!;
                return option.name;
              }}
              renderOption={(props, option) => {
                const { key, ...rest } = props;
                return <li key={key} {...rest}>{option.name}</li>;
              }}
              freeSolo
              renderInput={(params) => (
                <TextField {...params} label={t('ingredients.form.brand', 'Brand')} />
              )}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ToggleButton
                value="check"
                selected={isPackagePrice}
                onChange={() => setValue('isPackagePrice', !isPackagePrice)}
                sx={{
                  width: 24,
                  height: 24,
                  minWidth: 24,
                  p: 0,
                  borderRadius: 1,
                  border: '2px solid',
                  borderColor: isPackagePrice ? 'primary.main' : 'grey.300',
                  bgcolor: isPackagePrice ? 'primary.main' : 'transparent',
                  color: isPackagePrice ? 'white' : 'grey.500',
                  '&:hover': {
                    bgcolor: isPackagePrice ? 'primary.dark' : 'grey.100',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                  },
                }}
              >
                <Check size={16} />
              </ToggleButton>
              <Box component="span" sx={{ color: 'text.primary' }}>
                {t('ingredients.form.isPackagePrice')}
              </Box>
            </Box>

            {isPackagePrice && (
              <>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <TextField
                    label={t('ingredients.form.packagePrice')}
                    type="number"
                    fullWidth
                    {...register('packagePrice', {
                      valueAsNumber: true,
                      required: isPackagePrice ? t('validation.required') : false
                    })}
                    slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
                  />
                   <TextField
                    label={t('ingredients.form.packageQty')}
                    type="number"
                    fullWidth
                    {...register('packageQty', {
                      valueAsNumber: true,
                       required: isPackagePrice ? t('validation.required') : false
                    })}
                    slotProps={{ htmlInput: { min: 0, step: "any" } }}
                  />
                </Box>
                <Controller
                  name="packageMetricId"
                  control={control}
                  rules={{ required: isPackagePrice ? t('validation.required') : false }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label={t('ingredients.form.packageMetric')}
                      fullWidth
                      error={!!errors.packageMetricId}
                      helperText={errors.packageMetricId?.message}
                    >
                      {metrics.map((metric) => (
                        <MenuItem key={metric.id} value={metric.id}>
                          {metric.title} ({metric.abbrv})
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </>
            )}

            <Controller
              name="metricId"
              control={control}
              rules={{ required: t('validation.required') }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label={t('ingredients.form.metric', 'Metric')}
                  fullWidth
                  error={!!errors.metricId}
                  helperText={errors.metricId?.message}
                >
                  {metrics.map((metric) => (
                    <MenuItem key={metric.id} value={metric.id}>
                      {metric.title} ({metric.abbrv})
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  label={t('ingredients.form.price', 'Price')}
                  type="number"
                  fullWidth
                  {...register('price', {
                    required: t('validation.required'),
                    min: { value: 0, message: t('validation.minValue', { min: 0 }) },
                    valueAsNumber: true,
                  })}
                  disabled={!!isPackagePrice && !conversionFailed}
                  error={!!errors.price}
                  helperText={errors.price?.message}
                  slotProps={{
                    htmlInput: { step: "0.0001" },
                    input: {
                      endAdornment: converting ? (
                        <InputAdornment position="end">
                          <CircularProgress size={20} />
                        </InputAdornment>
                      ) : undefined
                    }
                  }}
                />
                {isPackagePrice && (
                  <Tooltip title={t('common.refresh', 'Recalculate')}>
                    <span>
                      <IconButton
                        onClick={convertPrice}
                        disabled={converting}
                        sx={{ mt: 1 }}
                      >
                        <RefreshCw size={20} />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </Box>
              {converting && (
                <Box sx={{ mt: 0.5, color: 'text.secondary', fontSize: '0.875rem' }}>
                  {t('ingredients.form.calculating', 'Calculating price...')}
                </Box>
              )}
              {conversionFailed && !converting && (
                <Box sx={{ mt: 0.5, color: 'warning.main', fontSize: '0.875rem' }}>
                  {t('ingredients.form.conversionFailed', 'Conversion failed. Please enter the price manually.')}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={loading || converting} autoFocus>
            {loading ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default IngredientForm;
