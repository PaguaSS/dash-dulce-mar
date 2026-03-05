import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { calculatorProductsService, type CalculatorCategory, type CalculatorPricing } from '../../../services/calculator-products.service';

const PricingEditor: React.FC = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<CalculatorCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [_pricing, setPricing] = useState<CalculatorPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    basePrice: '0',
    pricePerPortion: '0',
    currency: 'CRC',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await calculatorProductsService.getCategories({ limit: 50 });
        setCategories(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedCategory(response.data.data[0].slug);
        }
        setError(null);
      } catch (err) {
        setError('Error loading categories');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;

    const fetchPricing = async () => {
      try {
        setLoading(true);
        const response = await calculatorProductsService.getPricing(selectedCategory);
        setPricing(response.data);
        setFormData({
          basePrice: response.data.basePrice?.toString() || '0',
          pricePerPortion: response.data.pricePerPortion?.toString() || '0',
          currency: response.data.currency || 'CRC',
        });
        setError(null);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setPricing(null);
          setFormData({
            basePrice: '0',
            pricePerPortion: '0',
            currency: 'CRC',
          });
        } else {
          setError('Error loading pricing');
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, [selectedCategory]);

  const handleSave = async () => {
    if (!selectedCategory) return;

    try {
      setSaving(true);
      await calculatorProductsService.updatePricing(selectedCategory, {
        basePrice: parseFloat(formData.basePrice) || 0,
        pricePerPortion: parseFloat(formData.pricePerPortion) || 0,
        currency: formData.currency,
      });
      toast.success(t('common.updateSuccess'));
    } catch (err) {
      toast.error(t('common.updateError'));
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading && categories.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && categories.length === 0) {
    return <Alert severity="error">{error}</Alert>;
  }

  const selectedCategoryData = categories.find((c) => c.slug === selectedCategory);

  return (
    <Box>
      <Box mb={3}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>{t('calculatorProducts.tabs.categories')}</InputLabel>
          <Select
            value={selectedCategory}
            label={t('calculatorProducts.tabs.categories')}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <MenuItem key={cat.slug} value={cat.slug}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {selectedCategory && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('calculatorProducts.tabs.pricing')}: {selectedCategoryData?.name}
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label={t('calculatorProducts.pricing.basePrice')}
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₡</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label={t('calculatorProducts.pricing.pricePerPortion')}
                    type="number"
                    value={formData.pricePerPortion}
                    onChange={(e) => setFormData({ ...formData, pricePerPortion: e.target.value })}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₡</InputAdornment>,
                    }}
                    helperText={
                      selectedCategoryData?.portionType === 'unit'
                        ? t('calculatorProducts.portionTypes.unit')
                        : selectedCategoryData?.portionType === 'fixed'
                        ? t('calculatorProducts.portionTypes.fixed')
                        : t('calculatorProducts.portionTypes.range')
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>{t('calculatorProducts.pricing.currency')}</InputLabel>
                    <Select
                      value={formData.currency}
                      label={t('calculatorProducts.pricing.currency')}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    >
                      <MenuItem value="CRC">CRC (₡)</MenuItem>
                      <MenuItem value="USD">USD ($)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {selectedCategoryData && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>{t('calculatorProducts.category.portionType')}:</strong>{' '}
                        {t(`calculatorProducts.portionTypes.${selectedCategoryData.portionType}`)}
                        {selectedCategoryData.portionType === 'range' && (
                          <> ({selectedCategoryData.minPortions} - {selectedCategoryData.maxPortions})</>
                        )}
                        {selectedCategoryData.portionType === 'fixed' && selectedCategoryData.fixedPortionOptions && (
                          <> ({selectedCategoryData.fixedPortionOptions.join(', ')})</>
                        )}
                      </Typography>
                    </Alert>
                  </Grid>
                )}

                <Grid size={{ xs: 12 }}>
                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    <Button
                      variant="contained"
                      startIcon={<Save size={20} />}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? t('common.saving') : t('common.save')}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PricingEditor;
