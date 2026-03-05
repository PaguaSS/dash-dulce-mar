import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import { Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { calculatorProductsService, type CalculatorCategory } from '../../../services/calculator-products.service';
import ConfirmationModal from '../../../components/ConfirmationModal';

const CategoryList: React.FC = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<CalculatorCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CalculatorCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    portionType: 'range' as 'fixed' | 'range' | 'unit',
    minPortions: '',
    maxPortions: '',
    sortOrder: '0',
    active: true,
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await calculatorProductsService.getCategories({ limit: 50 });
      setCategories(response.data.data);
      setError(null);
    } catch (err) {
      setError('Error loading categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenForm = (category?: CalculatorCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        icon: category.icon || '',
        portionType: category.portionType,
        minPortions: category.minPortions?.toString() || '',
        maxPortions: category.maxPortions?.toString() || '',
        sortOrder: category.sortOrder.toString(),
        active: category.active,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: '',
        portionType: 'range',
        minPortions: '',
        maxPortions: '',
        sortOrder: '0',
        active: true,
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description || null,
        icon: formData.icon || null,
        portionType: formData.portionType,
        minPortions: formData.minPortions ? parseInt(formData.minPortions) : null,
        maxPortions: formData.maxPortions ? parseInt(formData.maxPortions) : null,
        sortOrder: parseInt(formData.sortOrder) || 0,
        active: formData.active,
      };

      if (editingCategory) {
        await calculatorProductsService.updateCategory(editingCategory.id, data);
        toast.success(t('common.updateSuccess'));
      } else {
        await calculatorProductsService.createCategory(data);
        toast.success(t('common.createSuccess'));
      }

      handleCloseForm();
      fetchCategories();
    } catch (err) {
      toast.error(editingCategory ? t('common.updateError') : t('common.createError'));
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await calculatorProductsService.deleteCategory(deleteId);
      toast.success(t('common.deleteSuccess'));
      setDeleteId(null);
      fetchCategories();
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
      <Box display="flex" justifyContent="flex-end" mb={2}>
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
              <TableCell>{t('calculatorProducts.category.name')}</TableCell>
              <TableCell>{t('calculatorProducts.category.slug')}</TableCell>
              <TableCell>{t('calculatorProducts.category.portionType')}</TableCell>
              <TableCell>{t('calculatorProducts.category.sortOrder')}</TableCell>
              <TableCell>{t('common.active')}</TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>
                  <Chip label={category.slug} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  {t(`calculatorProducts.portionTypes.${category.portionType}`)}
                </TableCell>
                <TableCell>{category.sortOrder}</TableCell>
                <TableCell>
                  <Chip
                    label={category.active ? t('common.active') : t('common.inactive')}
                    color={category.active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenForm(category)}
                    color="primary"
                    aria-label={t('common.edit')}
                  >
                    <Edit size={18} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setDeleteId(category.id)}
                    color="error"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
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
          {editingCategory ? t('common.edit') : t('common.add')}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label={t('calculatorProducts.category.name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label={t('calculatorProducts.category.slug')}
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              fullWidth
              placeholder={formData.name.toLowerCase().replace(/\s+/g, '-')}
            />
            <TextField
              label={t('calculatorProducts.category.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label={t('calculatorProducts.category.icon')}
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              fullWidth
              placeholder="cake, pie-chart, cookie"
            />
            <FormControl fullWidth>
              <InputLabel>{t('calculatorProducts.category.portionType')}</InputLabel>
              <Select
                value={formData.portionType}
                label={t('calculatorProducts.category.portionType')}
                onChange={(e) => setFormData({ ...formData, portionType: e.target.value as 'fixed' | 'range' | 'unit' })}
              >
                <MenuItem value="range">{t('calculatorProducts.portionTypes.range')}</MenuItem>
                <MenuItem value="fixed">{t('calculatorProducts.portionTypes.fixed')}</MenuItem>
                <MenuItem value="unit">{t('calculatorProducts.portionTypes.unit')}</MenuItem>
              </Select>
            </FormControl>
            <Box display="flex" gap={2}>
              <TextField
                label={t('calculatorProducts.category.minPortions')}
                type="number"
                value={formData.minPortions}
                onChange={(e) => setFormData({ ...formData, minPortions: e.target.value })}
                fullWidth
              />
              <TextField
                label={t('calculatorProducts.category.maxPortions')}
                type="number"
                value={formData.maxPortions}
                onChange={(e) => setFormData({ ...formData, maxPortions: e.target.value })}
                fullWidth
              />
            </Box>
            <TextField
              label={t('calculatorProducts.category.sortOrder')}
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

export default CategoryList;
