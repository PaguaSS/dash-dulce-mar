import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Avatar,
} from '@mui/material';
import { Plus, Edit, Trash2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { calculatorProductsService, type CalculatorOption, type CalculatorCategory } from '../../../services/calculator-products.service';
import ConfirmationModal from '../../../components/ConfirmationModal';

const OPTION_TYPES = ['FLAVOR', 'TYPE', 'BASE', 'FILLING', 'COVERING', 'PRODUCT'] as const;

const OptionList: React.FC = () => {
  const { t } = useTranslation();
  const [options, setOptions] = useState<CalculatorOption[]>([]);
  const [categories, setCategories] = useState<CalculatorCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<CalculatorOption | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');

  const [formData, setFormData] = useState({
    categoryId: '',
    optionType: 'FLAVOR' as typeof OPTION_TYPES[number],
    name: '',
    slug: '',
    description: '',
    priceModifier: '0',
    isPercentage: false,
    sortOrder: '0',
    active: true,
    isMainProduct: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [optionsRes, categoriesRes] = await Promise.all([
        calculatorProductsService.getOptions({ limit: 100, categoryId: filterCategory || undefined }),
        calculatorProductsService.getCategories({ limit: 50 }),
      ]);
      setOptions(optionsRes.data.data);
      setCategories(categoriesRes.data.data);
      setError(null);
    } catch (err) {
      setError('Error loading data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterCategory]);

  const handleOpenForm = (option?: CalculatorOption) => {
    if (option) {
      setEditingOption(option);
      setFormData({
        categoryId: option.categoryId,
        optionType: option.optionType,
        name: option.name,
        slug: option.slug,
        description: option.description || '',
        priceModifier: option.priceModifier.toString(),
        isPercentage: option.isPercentage,
        sortOrder: option.sortOrder.toString(),
        active: option.active,
        isMainProduct: option.isMainProduct || false,
      });
      // Set image preview if option has an image
      if (option.image) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        setImagePreview(`${apiUrl}/assets/calculator-options/${option.image}`);
      } else {
        setImagePreview(null);
      }
    } else {
      setEditingOption(null);
      setFormData({
        categoryId: filterCategory || (categories[0]?.id || ''),
        optionType: 'FLAVOR',
        name: '',
        slug: '',
        description: '',
        priceModifier: '0',
        isPercentage: false,
        sortOrder: '0',
        active: true,
        isMainProduct: false,
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingOption(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(t('common.invalidImageType'));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('common.imageTooLarge'));
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    try {
      const data = {
        categoryId: formData.categoryId,
        optionType: formData.optionType,
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description || null,
        priceModifier: parseFloat(formData.priceModifier) || 0,
        isPercentage: formData.isPercentage,
        sortOrder: parseInt(formData.sortOrder) || 0,
        active: formData.active,
        isMainProduct: formData.isMainProduct,
      };

      if (editingOption) {
        const { categoryId, ...updateData } = data;
        await calculatorProductsService.updateOption(editingOption.id, updateData, imageFile || undefined);
        toast.success(t('common.updateSuccess'));
      } else {
        await calculatorProductsService.createOption(data, imageFile || undefined);
        toast.success(t('common.createSuccess'));
      }

      handleCloseForm();
      fetchData();
    } catch (err) {
      toast.error(editingOption ? t('common.updateError') : t('common.createError'));
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await calculatorProductsService.deleteOption(deleteId);
      toast.success(t('common.deleteSuccess'));
      setDeleteId(null);
      fetchData();
    } catch (err) {
      toast.error(t('common.deleteError'));
      console.error(err);
    }
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
      <Box display="flex" justifyContent="space-between" mb={2} gap={2} flexWrap="wrap">
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>{t('calculatorProducts.tabs.categories')}</InputLabel>
          <Select
            value={filterCategory}
            label={t('calculatorProducts.tabs.categories')}
            onChange={(e) => setFilterCategory(e.target.value)}
            size="small"
          >
            <MenuItem value="">{t('common.search')} - {t('common.noData')}</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => handleOpenForm()}
        >
          {t('common.add')}
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={60}>{t('common.image')}</TableCell>
              <TableCell>{t('calculatorProducts.option.name')}</TableCell>
              <TableCell>{t('calculatorProducts.option.type')}</TableCell>
              <TableCell>{t('calculatorProducts.tabs.categories')}</TableCell>
              <TableCell>{t('calculatorProducts.option.priceModifier')}</TableCell>
              <TableCell>{t('common.active')}</TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {options.map((option) => {
              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
              const imageUrl = option.image ? `${apiUrl}/assets/calculator-options/${option.image}` : null;
              return (
              <TableRow key={option.id}>
                <TableCell>
                  <Avatar
                    src={imageUrl || undefined}
                    variant="rounded"
                    sx={{ width: 40, height: 40 }}
                  >
                    {!imageUrl && option.name.charAt(0)}
                  </Avatar>
                </TableCell>
                <TableCell>{option.name}</TableCell>
                <TableCell>
                  <Chip
                    label={t(`calculatorProducts.optionTypes.${option.optionType}`)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{option.category?.name || '-'}</TableCell>
                <TableCell>
                  {option.priceModifier !== 0 && (
                    <Chip
                      label={option.isPercentage ? `${option.priceModifier}%` : `₡${option.priceModifier}`}
                      size="small"
                      color={option.priceModifier > 0 ? 'success' : 'error'}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={option.active ? t('common.active') : t('common.inactive')}
                    color={option.active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenForm(option)}
                    color="primary"
                    aria-label={t('common.edit')}
                  >
                    <Edit size={18} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setDeleteId(option.id)}
                    color="error"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
              );
            })}
            {options.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {t('common.noData')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingOption ? t('common.edit') : t('common.add')}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl fullWidth required disabled={!!editingOption}>
              <InputLabel>{t('calculatorProducts.tabs.categories')}</InputLabel>
              <Select
                value={formData.categoryId}
                label={t('calculatorProducts.tabs.categories')}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>{t('calculatorProducts.option.type')}</InputLabel>
              <Select
                value={formData.optionType}
                label={t('calculatorProducts.option.type')}
                onChange={(e) => setFormData({ ...formData, optionType: e.target.value as typeof OPTION_TYPES[number] })}
              >
                {OPTION_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {t(`calculatorProducts.optionTypes.${type}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t('calculatorProducts.option.name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label={t('calculatorProducts.option.slug')}
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              fullWidth
              placeholder={formData.name.toLowerCase().replace(/\s+/g, '-')}
            />
            <TextField
              label={t('common.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                label={t('calculatorProducts.option.priceModifier')}
                type="number"
                value={formData.priceModifier}
                onChange={(e) => setFormData({ ...formData, priceModifier: e.target.value })}
                fullWidth
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPercentage}
                    onChange={(e) => setFormData({ ...formData, isPercentage: e.target.checked })}
                  />
                }
                label="%"
              />
            </Box>
            <TextField
              label={t('calculatorProducts.option.sortOrder')}
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
              }
              label={t('common.active')}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isMainProduct}
                  onChange={(e) => setFormData({ ...formData, isMainProduct: e.target.checked })}
                />
              }
              label={t('calculatorProducts.mainProducts.isMainProduct')}
            />

            {/* Image Upload */}
            <Box>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                id="option-image-upload"
              />
              <Box display="flex" alignItems="center" gap={2}>
                {imagePreview ? (
                  <Box position="relative">
                    <Avatar
                      src={imagePreview}
                      variant="rounded"
                      sx={{ width: 80, height: 80 }}
                    />
                    <IconButton
                      size="small"
                      onClick={handleRemoveImage}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: 'error.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'error.dark' },
                      }}
                    >
                      <X size={14} />
                    </IconButton>
                  </Box>
                ) : (
                  <label htmlFor="option-image-upload">
                    <Button
                      component="span"
                      variant="outlined"
                      startIcon={<Upload size={18} />}
                    >
                      {t('common.uploadImage')}
                    </Button>
                  </label>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('common.confirmDelete')}
        message={t('common.deleteWarning')}
      />
    </Box>
  );
};

export default OptionList;
