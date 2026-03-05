import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Trash2 as TrashIcon,
  Plus as PlusIcon,
  Save as SaveIcon,
} from 'lucide-react';
import { recipesService } from '../../services/recipes.service';
import type {
  CreateRecipeDto,
  CreateRecipeItemDto,
} from '../../services/recipes.service';
import { metricService } from '../../services/metric.service';
import type { Metric } from '../../services/metric.service';
import { ingredientService } from '../../services/ingredient.service';
import type { Ingredient } from '../../services/ingredient.service';
import BackButton from '../../components/common/BackButton';
import toast from 'react-hot-toast';
import { useConfigStore } from '../../store/configStore';

const RecipeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currencySign = useConfigStore((state) => state.currencySign);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const [formData, setFormData] = useState<CreateRecipeDto>({
    title: '',
    servings: 1,
    ingredients: [],
  });

  // Helper functions to get ingredient details

  const getIngredientPrice = (id?: string) => {
    if (!id) return '0.00';
    const ing = ingredients.find((i) => i.id === id);
    return ing ? ing.price : '0.00';
  };

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [metricsData, ingredientsData] = await Promise.all([
          metricService.getAll(),
          ingredientService.getAll(1, 1000),
        ]);
        setMetrics(metricsData.data);
        setIngredients(ingredientsData.data);
      } catch (error) {
        console.error('Error loading dependencies', error);
        toast.error(t('common.messages.errorLoading'));
      }
    };

    loadDependencies();
  }, [t]);

  useEffect(() => {
    if (isEditMode) {
      const loadRecipe = async () => {
        setInitialLoading(true);
        try {
          const data = await recipesService.getOne(id);
          setFormData({
            title: data.title,
            servings: Number(data.servings),
            ingredients: data.ingredients.map((item) => ({
              metricId: item.metricId,
              ingredientId: item.ingredientId,
              qty: Number(item.qty),
            })),
          });
        } catch (error) {
          console.error('Error fetching recipe', error);
          toast.error(t('common.messages.errorLoading'));
          navigate('/dashboard/recipes');
        } finally {
          setInitialLoading(false);
        }
      };
      loadRecipe();
    } else {
      // Add one empty item by default for new recipes
      addItem();
    }
  }, [id, isEditMode, navigate, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleItemChange = (
    index: number,
    field: keyof CreateRecipeItemDto,
    value: string | number,
  ) => {
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: value,
    };

    // Auto-fill metric if ingredient selected (optional UX enhancement)
    if (field === 'ingredientId') {
      const ingredient = ingredients.find((i) => i.id === value);
      if (ingredient) {
        updatedIngredients[index].metricId = ingredient.metricId;
      }
    }

    setFormData({ ...formData, ingredients: updatedIngredients });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { metricId: '', ingredientId: '', qty: 0 },
      ],
    }));
  };

  const removeItem = (index: number) => {
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients.splice(index, 1);
    setFormData({ ...formData, ingredients: updatedIngredients });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error(t('validation.required'));
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        await recipesService.update(id, formData);
        toast.success(t('recipes.messages.updateSuccess'));
      } else {
        await recipesService.create(formData);
        toast.success(t('recipes.messages.createSuccess'));
      }
      navigate('/dashboard/recipes');
    } catch (error) {
      console.error('Error saving recipe', error);
      toast.error(t('common.messages.operationFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <BackButton />
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {isEditMode ? t('recipes.edit') : t('recipes.create')}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 8 }}>
                <TextField
                  fullWidth
                  label={t('recipes.form.title')}
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('recipes.form.servings')}
                  name="servings"
                  value={formData.servings || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, servings: Number(e.target.value) || 0 }))
                  }
                  required
                  slotProps={{ htmlInput: { min: 1 } }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">{t('recipes.form.items')}</Typography>
              <Button
                startIcon={<PlusIcon size={18} />}
                onClick={addItem}
                variant="outlined"
                size="small"
              >
                {t('recipes.form.addItem')}
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="30%">
                      {t('recipes.form.ingredient')}
                    </TableCell>
                    <TableCell width="15%">{t('recipes.form.qty')}</TableCell>
                    <TableCell width="15%">
                      {t('recipes.form.metric')}
                    </TableCell>
                    <TableCell width="15%">{t('recipes.form.price')}</TableCell>
                    <TableCell width="5%"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.ingredients.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={
                            ingredients.some((i) => i.id === item.ingredientId)
                              ? item.ingredientId
                              : ''
                          }
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              'ingredientId',
                              e.target.value,
                            )
                          }
                          required
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {ingredients.map((ing) => (
                            <MenuItem key={ing.id} value={ing.id}>
                              {ing.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={item.qty || ''}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              'qty',
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          value={
                            metrics.some((m) => m.id === item.metricId)
                              ? item.metricId
                              : ''
                          }
                          onChange={(e) =>
                            handleItemChange(index, 'metricId', e.target.value)
                          }
                          required
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {metrics.map((metric) => (
                            <MenuItem key={metric.id} value={metric.id}>
                              {metric.abbrv || metric.title}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        {/* Price is read-only/calculated */}
                        <Typography variant="body2">
                          {currencySign}
                          {getIngredientPrice(item.ingredientId)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeItem(index)}
                        >
                          <TrashIcon size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard/recipes')}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SaveIcon size={20} />
                )
              }
              disabled={loading}
            >
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RecipeForm;
