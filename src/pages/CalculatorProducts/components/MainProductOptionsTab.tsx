import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Typography,
  Collapse,
  Avatar,
} from '@mui/material';
import { ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  calculatorProductsService,
  type CalculatorOption,
  type CalculatorCategory,
} from '../../../services/calculator-products.service';
import ConfirmationModal from '../../../components/ConfirmationModal';

const MainProductOptionsTab: React.FC = () => {
  const { t } = useTranslation();
  const [mainProductOptions, setMainProductOptions] = useState<CalculatorOption[]>([]);
  const [categories, setCategories] = useState<CalculatorCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Customization management state
  const [isCustomizationDialogOpen, setIsCustomizationDialogOpen] = useState(false);
  const [selectedMainProduct, setSelectedMainProduct] = useState<CalculatorOption | null>(null);
  const [availableCustomizations, setAvailableCustomizations] = useState<CalculatorOption[]>([]);
  const [selectedCustomizationIds, setSelectedCustomizationIds] = useState<string[]>([]);
  const [loadingCustomizations, setLoadingCustomizations] = useState(false);

  // Remove main product confirmation
  const [removeMainProductId, setRemoveMainProductId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [mainProductsRes, categoriesRes] = await Promise.all([
        calculatorProductsService.getMainProductOptions({
          categoryId: filterCategory || undefined,
          limit: 100,
        }),
        calculatorProductsService.getCategories({ limit: 50 }),
      ]);
      setMainProductOptions(mainProductsRes.data.data);
      setCategories(categoriesRes.data.data);
      setError(null);
    } catch (err) {
      setError('Error loading data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleOpenCustomizationDialog = async (mainProduct: CalculatorOption) => {
    setSelectedMainProduct(mainProduct);
    setLoadingCustomizations(true);
    setIsCustomizationDialogOpen(true);

    try {
      const [availableRes, currentRes] = await Promise.all([
        calculatorProductsService.getAvailableCustomizations(mainProduct.id),
        calculatorProductsService.getMainProductOptionWithCustomizations(mainProduct.id),
      ]);

      const currentCustomizationIds = currentRes.data.customizationLinks?.map(
        (link) => link.customizationOptionId
      ) || [];

      // Combine current customizations with available ones
      const currentCustomizations = currentRes.data.customizationLinks?.map(
        (link) => link.customizationOption
      ).filter(Boolean) as CalculatorOption[] || [];

      const allOptions = [...currentCustomizations, ...availableRes.data];
      // Remove duplicates
      const uniqueOptions = allOptions.filter(
        (option, index, self) => index === self.findIndex((o) => o.id === option.id)
      );

      setAvailableCustomizations(uniqueOptions);
      setSelectedCustomizationIds(currentCustomizationIds);
    } catch (err) {
      console.error('Error loading customizations:', err);
      toast.error(t('common.error'));
    } finally {
      setLoadingCustomizations(false);
    }
  };

  const handleCloseCustomizationDialog = () => {
    setIsCustomizationDialogOpen(false);
    setSelectedMainProduct(null);
    setAvailableCustomizations([]);
    setSelectedCustomizationIds([]);
  };

  const handleSaveCustomizations = async () => {
    if (!selectedMainProduct) return;

    try {
      await calculatorProductsService.setCustomizations(
        selectedMainProduct.id,
        selectedCustomizationIds
      );
      toast.success(t('common.updateSuccess'));
      handleCloseCustomizationDialog();
      fetchData();
    } catch (err) {
      console.error('Error saving customizations:', err);
      toast.error(t('common.updateError'));
    }
  };

  const handleRemoveMainProduct = async () => {
    if (!removeMainProductId) return;

    try {
      await calculatorProductsService.toggleMainProductOption(removeMainProductId, false);
      toast.success(t('common.updateSuccess'));
      setRemoveMainProductId(null);
      fetchData();
    } catch (err) {
      console.error('Error removing main product status:', err);
      toast.error(t('common.updateError'));
    }
  };

  const getImageUrl = (image: string | null) => {
    if (!image) return null;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${apiUrl}/assets/calculator-options/${image}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('calculatorProducts.mainProducts.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('calculatorProducts.mainProducts.description')}
        </Typography>
      </Box>

      <Box display="flex" justifyContent="space-between" mb={2} gap={2} flexWrap="wrap">
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>{t('calculatorProducts.tabs.categories')}</InputLabel>
          <Select
            value={filterCategory}
            label={t('calculatorProducts.tabs.categories')}
            onChange={(e) => setFilterCategory(e.target.value)}
            size="small"
          >
            <MenuItem value="">{t('common.all')}</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50} />
              <TableCell width={60}>{t('common.image')}</TableCell>
              <TableCell>{t('calculatorProducts.option.name')}</TableCell>
              <TableCell>{t('calculatorProducts.tabs.categories')}</TableCell>
              <TableCell>{t('calculatorProducts.mainProducts.customizations')}</TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mainProductOptions.map((option) => {
              const isExpanded = expandedRows.has(option.id);
              const customizations = option.customizationLinks || [];

              return (
                <React.Fragment key={option.id}>
                  <TableRow>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleExpand(option.id)}
                        disabled={customizations.length === 0}
                      >
                        {customizations.length > 0 ? (
                          isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />
                        ) : null}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Avatar
                        src={getImageUrl(option.image) || undefined}
                        variant="rounded"
                        sx={{ width: 40, height: 40 }}
                      >
                        {!option.image && option.name.charAt(0)}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>{option.category?.name || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${customizations.length} ${t('calculatorProducts.mainProducts.customizations').toLowerCase()}`}
                        size="small"
                        color={customizations.length > 0 ? 'primary' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenCustomizationDialog(option)}
                        color="primary"
                        title={t('calculatorProducts.mainProducts.manageCustomizations')}
                      >
                        <Edit size={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setRemoveMainProductId(option.id)}
                        color="error"
                        title={t('calculatorProducts.mainProducts.removeMainProduct')}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {/* Expanded row for customizations */}
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0, borderBottom: isExpanded ? undefined : 'none' }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, pl: 8 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            {t('calculatorProducts.mainProducts.assignedCustomizations')}:
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={1}>
                            {customizations.map((link) => (
                              <Chip
                                key={link.id}
                                label={link.customizationOption?.name || link.customizationOptionId}
                                size="small"
                                avatar={
                                  <Avatar
                                    src={getImageUrl(link.customizationOption?.image || null) || undefined}
                                    sx={{ width: 24, height: 24 }}
                                  >
                                    {link.customizationOption?.name?.charAt(0) || '?'}
                                  </Avatar>
                                }
                              />
                            ))}
                            {customizations.length === 0 && (
                              <Typography variant="body2" color="text.secondary">
                                {t('calculatorProducts.mainProducts.noCustomizations')}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
            {mainProductOptions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Box py={4}>
                    <Typography color="text.secondary">
                      {t('calculatorProducts.mainProducts.noMainProducts')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {t('calculatorProducts.mainProducts.noMainProductsHint')}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Customization Management Dialog */}
      <Dialog
        open={isCustomizationDialogOpen}
        onClose={handleCloseCustomizationDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t('calculatorProducts.mainProducts.manageCustomizations')}
          {selectedMainProduct && (
            <Typography variant="body2" color="text.secondary">
              {selectedMainProduct.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {loadingCustomizations ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box pt={1}>
              <FormControl fullWidth>
                <InputLabel>{t('calculatorProducts.mainProducts.selectCustomizations')}</InputLabel>
                <Select
                  multiple
                  value={selectedCustomizationIds}
                  onChange={(e) => setSelectedCustomizationIds(e.target.value as string[])}
                  input={<OutlinedInput label={t('calculatorProducts.mainProducts.selectCustomizations')} />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const option = availableCustomizations.find((o) => o.id === id);
                        return (
                          <Chip
                            key={id}
                            label={option?.name || id}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {availableCustomizations.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      <Checkbox checked={selectedCustomizationIds.includes(option.id)} />
                      <ListItemText
                        primary={option.name}
                        secondary={t(`calculatorProducts.optionTypes.${option.optionType}`)}
                      />
                    </MenuItem>
                  ))}
                  {availableCustomizations.length === 0 && (
                    <MenuItem disabled>
                      <Typography color="text.secondary">
                        {t('calculatorProducts.mainProducts.noAvailableCustomizations')}
                      </Typography>
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCustomizationDialog}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSaveCustomizations}
            disabled={loadingCustomizations}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Main Product Confirmation */}
      <ConfirmationModal
        isOpen={!!removeMainProductId}
        onCancel={() => setRemoveMainProductId(null)}
        onConfirm={handleRemoveMainProduct}
        title={t('calculatorProducts.mainProducts.removeMainProductTitle')}
        message={t('calculatorProducts.mainProducts.removeMainProductMessage')}
      />
    </Box>
  );
};

export default MainProductOptionsTab;
