import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Fab,
  Tooltip,
} from '@mui/material';
import { Plus, Trash2, Save } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import BackButton from '../../components/common/BackButton';
import {
  quotationService,
  QuotationItemType,
  type CreateQuotationItemDto,
} from '../../services/quotation.service';
import { clientService, type Client } from '../../services/client.service';
import { recipesService, type Recipe } from '../../services/recipes.service';
import {
  ingredientService,
  type Ingredient,
} from '../../services/ingredient.service';
import {
  calculatorParamsService,
  type CalculatorParams,
} from '../../services/calculatorParams.service';

interface FormItem extends CreateQuotationItemDto {
  tempId: string;
  subtotal: number;
}

const QuotationForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get('duplicateId');
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [taxRate, setTaxRate] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);
  const [items, setItems] = useState<FormItem[]>([]);

  // Data for dropdowns
  const [clients, setClients] = useState<Client[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [calcParams, setCalcParams] = useState<CalculatorParams | null>(null);

  // Add item dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addItemType, setAddItemType] = useState<QuotationItemType>(
    QuotationItemType.RECIPE,
  );

  // Calculated totals
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * (taxRate / 100);
  const totalBeforeProfit = subtotal + tax;

  const deliverySubtotal = items
    .filter((item) => item.type === QuotationItemType.DELIVERY)
    .reduce((sum, item) => sum + item.subtotal, 0);

  // Profit calculation excludes delivery cost (and its tax)
  const subtotalWithoutDelivery = subtotal - deliverySubtotal;
  const baseForProfit = subtotalWithoutDelivery * (1 + taxRate / 100);
  const profit = baseForProfit * (profitMargin / 100);

  const total = totalBeforeProfit + profit;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, recipesRes, ingredientsRes, paramsRes] =
          await Promise.all([
            clientService.getAll(1, 100),
            recipesService.getAll({ limit: 100 }),
            ingredientService.getAll(1, 100),
            calculatorParamsService.get(),
          ]);
        setClients(clientsRes.data);
        setRecipes(recipesRes.data);
        setIngredients(ingredientsRes.data);
        setCalcParams(paramsRes);
        // Set tax rate from crFee (convert decimal to percentage if needed)
        if (!isEditMode && paramsRes.crFee !== undefined) {
          const crFeeValue = Number(paramsRes.crFee);
          // If crFee is stored as decimal (e.g., 0.13), convert to percentage
          setTaxRate(crFeeValue <= 1 ? crFeeValue * 100 : crFeeValue);
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
        toast.error(t('common.errorLoading'));
      }
    };
    fetchData();
  }, [t, isEditMode]);

  // Fetch quotation if editing
  useEffect(() => {
    if (isEditMode && id) {
      const fetchQuotation = async () => {
        setFetching(true);
        try {
          const quotation = await quotationService.getOne(id);
          setDescription(quotation.description);
          const client = quotation.client
            ? clients.find((c) => c.id === quotation.client?.id) || null
            : null;
          setSelectedClient(client);
          setTaxRate(Number(quotation.taxRate));
          setProfitMargin(Number(quotation.profitMargin) || 0);
          setItems(
            quotation.items.map((item, idx) => ({
              tempId: `existing-${idx}`,
              type: item.type,
              itemReferenceId: item.itemReferenceId,
              name: item.name,
              quantity: Number(item.quantity),
              metric: item.metric,
              unitPrice: Number(item.unitPrice),
              subtotal: Number(item.subtotal),
              metadata: item.metadata,
            })),
          );
        } catch (error) {
          console.error('Failed to fetch quotation', error);
          toast.error(t('common.errorLoading'));
          navigate('/dashboard/quotations');
        } finally {
          setFetching(false);
        }
      };
      fetchQuotation();
    }
  }, [id, isEditMode, navigate, t, clients]);

  // Fetch quotation if duplicating
  useEffect(() => {
    if (duplicateId && !isEditMode) {
      const fetchQuotationToDuplicate = async () => {
        setFetching(true);
        try {
          const quotation = await quotationService.getOne(duplicateId);
          setDescription(`Copy of: ${quotation.description}`);
          const client = quotation.client
            ? clients.find((c) => c.id === quotation.client?.id) || null
            : null;
          setSelectedClient(client);
          setTaxRate(Number(quotation.taxRate));
          setProfitMargin(Number(quotation.profitMargin) || 0);
          setItems(
            quotation.items.map((item, idx) => ({
              tempId: `duplicate-${idx}`,
              type: item.type,
              itemReferenceId: item.itemReferenceId,
              name: item.name,
              quantity: Number(item.quantity),
              metric: item.metric,
              unitPrice: Number(item.unitPrice),
              subtotal: Number(item.subtotal),
              metadata: item.metadata,
            })),
          );
        } catch (error) {
          console.error('Failed to fetch quotation to duplicate', error);
          toast.error(t('common.errorLoading'));
          navigate('/dashboard/quotations');
        } finally {
          setFetching(false);
        }
      };
      fetchQuotationToDuplicate();
    }
  }, [duplicateId, isEditMode, navigate, t, clients]);

  const generateTempId = () =>
    `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addRecipeItem = (recipe: Recipe) => {
    // Create ingredient snapshot for historical accuracy
    const ingredientsSnapshot = recipe.ingredients.map((item) => ({
      ingredientId: item.ingredientId,
      name: item.ingredient?.name || '',
      qty: Number(item.qty),
      metric: item.ingredient?.metric?.abbrv || '',
      unitPrice: Number(item.ingredient?.price || 0),
      subtotal: Number(item.qty) * Number(item.ingredient?.price || 0),
    }));

    const calculatedPrice = ingredientsSnapshot.reduce(
      (sum, i) => sum + i.subtotal,
      0,
    );

    const metadata = {
      recipeId: recipe.id,
      servings: recipe.servings,
      calculatedPrice,
      ingredients: ingredientsSnapshot,
    };

    const newItem: FormItem = {
      tempId: generateTempId(),
      type: QuotationItemType.RECIPE,
      itemReferenceId: recipe.id,
      name: recipe.title,
      quantity: 1,
      metric: t('quotations.metrics.unit'),
      unitPrice: calculatedPrice,
      subtotal: calculatedPrice,
      metadata,
    };
    setItems([...items, newItem]);
    setAddDialogOpen(false);
  };

  const addIngredientItem = (ingredient: Ingredient) => {
    const unitPrice = Number(ingredient.price);

    // Store price snapshot for historical accuracy
    const metadata = {
      ingredientId: ingredient.id,
      brandId: ingredient.brandId || null,
      brandName: ingredient.brand?.name || null,
      metricId: ingredient.metricId,
      metricAbbrv: ingredient.metric?.abbrv || '',
      priceAtQuotation: unitPrice,
    };

    const newItem: FormItem = {
      tempId: generateTempId(),
      type: QuotationItemType.INGREDIENT,
      itemReferenceId: ingredient.id,
      name: ingredient.name,
      quantity: 1,
      metric: ingredient.metric?.abbrv || '',
      unitPrice,
      subtotal: unitPrice,
      metadata,
    };
    setItems([...items, newItem]);
    setAddDialogOpen(false);
  };

  const addVariableCostItem = (type: QuotationItemType) => {
    if (!calcParams) return;

    let name = '';
    let metric = '';
    let unitPrice = 0;

    switch (type) {
      case QuotationItemType.LABOR:
        name = t('quotations.variableCosts.bakerPay');
        metric = t('quotations.metrics.hours');
        unitPrice = calcParams.bakerPayPerHour;
        break;
      case QuotationItemType.DELIVERY:
        name = t('quotations.variableCosts.delivery');
        metric = 'km';
        unitPrice = calcParams.gasPricePerLt / calcParams.averageKmPerLitre;
        break;
      case QuotationItemType.WATER:
        name = t('quotations.variableCosts.water');
        metric = t('quotations.metrics.liters');
        unitPrice = calcParams.waterPricePerLitre;
        break;
      case QuotationItemType.BAKE_TIME:
        name = t('quotations.variableCosts.bakeTime');
        metric = t('quotations.metrics.minutes');
        unitPrice = calcParams.bakePricePerMin;
        break;
      default:
        return;
    }

    const newItem: FormItem = {
      tempId: generateTempId(),
      type,
      itemReferenceId: null,
      name,
      quantity: 1,
      metric,
      unitPrice,
      subtotal: unitPrice,
      metadata: { ...calcParams },
    };
    setItems([...items, newItem]);
    setAddDialogOpen(false);
  };

  const addCustomItem = () => {
    const newItem: FormItem = {
      tempId: generateTempId(),
      type: QuotationItemType.CUSTOM,
      itemReferenceId: null,
      name: '',
      quantity: 1,
      metric: '',
      unitPrice: 0,
      subtotal: 0,
      metadata: null,
    };
    setItems([...items, newItem]);
    setAddDialogOpen(false);
  };

  const updateItem = (
    tempId: string,
    field: keyof FormItem,
    value: string | number | null | object,
  ) => {
    setItems(
      items.map((item) => {
        if (item.tempId !== tempId) return item;
        const updated = { ...item, [field]: value };
        // Recalculate subtotal
        if (field === 'quantity' || field === 'unitPrice') {
          updated.subtotal =
            Number(updated.quantity) * Number(updated.unitPrice);
        }
        return updated;
      }),
    );
  };

  const removeItem = (tempId: string) => {
    setItems(items.filter((item) => item.tempId !== tempId));
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error(t('validation.required'));
      return;
    }
    if (items.length === 0) {
      toast.error(t('quotations.errors.noItems'));
      return;
    }

    setLoading(true);
    try {
      // All calculations done on frontend - API stores exactly what we send
      const payload = {
        description,
        clientId: selectedClient?.id || null,
        taxRate,
        profitMargin,
        subtotal,
        tax,
        profit,
        total,
        items: items.map((item) => ({
          type: item.type,
          itemReferenceId: item.itemReferenceId || null,
          name: item.name,
          quantity: item.quantity,
          metric: item.metric || null,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          metadata: item.metadata || null,
        })),
      };

      if (isEditMode && id) {
        await quotationService.update(id, payload);
        toast.success(t('common.updateSuccess'));
      } else {
        await quotationService.create(payload);
        toast.success(t('common.createSuccess'));
      }
      navigate('/dashboard/quotations');
    } catch (error: any) {
      console.error('Failed to save quotation', error);
      console.error('Error response:', error?.response?.data);
      console.error('Error status:', error?.response?.status);
      const errorMessage = error?.response?.data?.message || error?.message || t('common.saveError');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <BackButton />
        <Typography variant="h4" fontWeight="bold">
          {isEditMode ? t('quotations.edit') : t('quotations.create')}
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('quotations.form.details')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          <TextField
            label={t('quotations.form.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            required
          />
          <Autocomplete
            options={clients}
            value={selectedClient}
            onChange={(_, value) => setSelectedClient(value)}
            getOptionLabel={(option) =>
              `${option.name} ${option.lastname || ''}`.trim()
            }
            renderInput={(params) => (
              <TextField {...params} label={t('quotations.form.client')} />
            )}
            sx={{ minWidth: 250 }}
          />
          <TextField
            label={t('quotations.form.taxRate')}
            type="number"
            value={taxRate}
            slotProps={{ input: { readOnly: true } }}
            sx={{ width: 120 }}
          />
          <TextField
            label={t('quotations.form.profitMargin')}
            type="number"
            value={profitMargin || ''}
            onChange={(e) => setProfitMargin(Number(e.target.value) || 0)}
            slotProps={{ htmlInput: { min: 0, max: 100, step: 1 } }}
            sx={{ width: 140 }}
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('quotations.form.items')}
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#eff6ff' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>
                  {t('quotations.table.type')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  {t('quotations.table.name')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>
                  {t('quotations.table.qty')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, width: 80 }}>
                  {t('quotations.table.metric')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, width: 120 }}>
                  {t('quotations.table.unitPrice')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, width: 120 }}>
                  {t('quotations.table.subtotal')}
                </TableCell>
                <TableCell sx={{ width: 60 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 4, color: 'text.secondary' }}
                  >
                    {t('quotations.noItems')}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.tempId}>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{ textTransform: 'uppercase', fontWeight: 500 }}
                      >
                        {t(`quotations.itemTypes.${item.type}`)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.type === QuotationItemType.CUSTOM ? (
                        <TextField
                          size="small"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(item.tempId, 'name', e.target.value)
                          }
                          placeholder={t('quotations.form.itemName')}
                        />
                      ) : (
                        item.name
                      )}
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) =>
                          updateItem(
                            item.tempId,
                            'quantity',
                            Number(e.target.value) || 0,
                          )
                        }
                        slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      {item.type === QuotationItemType.CUSTOM ? (
                        <TextField
                          size="small"
                          value={item.metric || ''}
                          onChange={(e) =>
                            updateItem(item.tempId, 'metric', e.target.value)
                          }
                          sx={{ width: 60 }}
                        />
                      ) : (
                        item.metric
                      )}
                    </TableCell>
                    <TableCell>
                      {item.type === QuotationItemType.CUSTOM ? (
                        <TextField
                          size="small"
                          type="number"
                          value={item.unitPrice || ''}
                          onChange={(e) =>
                            updateItem(
                              item.tempId,
                              'unitPrice',
                              Number(e.target.value) || 0,
                            )
                          }
                          slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                          sx={{ width: 100 }}
                        />
                      ) : (
                        formatCurrency(item.unitPrice)
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">
                        {formatCurrency(item.subtotal)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeItem(item.tempId)}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              width: 250,
            }}
          >
            <Typography>{t('quotations.totals.subtotal')}:</Typography>
            <Typography fontWeight="bold">
              {formatCurrency(subtotal)}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              width: 250,
            }}
          >
            <Typography>
              {t('quotations.totals.tax')} ({taxRate}%):
            </Typography>
            <Typography>{formatCurrency(tax)}</Typography>
          </Box>
          {profitMargin > 0 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                width: 250,
              }}
            >
              <Typography>
                {t('quotations.totals.profit')} ({profitMargin}%):
              </Typography>
              <Typography color="success.main">{formatCurrency(profit)}</Typography>
            </Box>
          )}
          <Divider sx={{ width: 250 }} />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              width: 250,
            }}
          >
            <Typography variant="h6">
              {t('quotations.totals.total')}:
            </Typography>
            <Typography variant="h6" color="primary" fontWeight="bold">
              {formatCurrency(total)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/dashboard/quotations')}
        >
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          startIcon={<Save size={18} />}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? t('common.saving') : t('common.save')}
        </Button>
      </Box>

      {/* Floating Add Item Button */}
      <Tooltip title={t('quotations.form.addItem')} placement="left">
        <Fab
          color="primary"
          onClick={() => setAddDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
          }}
        >
          <Plus size={24} />
        </Fab>
      </Tooltip>

      {/* Add Item Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('quotations.form.addItem')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              label={t('quotations.form.itemType')}
              value={addItemType}
              onChange={(e) =>
                setAddItemType(e.target.value as QuotationItemType)
              }
              fullWidth
            >
              <MenuItem value={QuotationItemType.RECIPE}>
                {t('quotations.itemTypes.RECIPE')}
              </MenuItem>
              <MenuItem value={QuotationItemType.INGREDIENT}>
                {t('quotations.itemTypes.INGREDIENT')}
              </MenuItem>
              <MenuItem value={QuotationItemType.LABOR}>
                {t('quotations.itemTypes.LABOR')}
              </MenuItem>
              <MenuItem value={QuotationItemType.DELIVERY}>
                {t('quotations.itemTypes.DELIVERY')}
              </MenuItem>
              <MenuItem value={QuotationItemType.WATER}>
                {t('quotations.itemTypes.WATER')}
              </MenuItem>
              <MenuItem value={QuotationItemType.BAKE_TIME}>
                {t('quotations.itemTypes.BAKE_TIME')}
              </MenuItem>
              <MenuItem value={QuotationItemType.CUSTOM}>
                {t('quotations.itemTypes.CUSTOM')}
              </MenuItem>
            </TextField>

            {addItemType === QuotationItemType.RECIPE && (
              <Autocomplete
                options={recipes}
                getOptionLabel={(option) => option.title}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('quotations.form.selectRecipe')}
                  />
                )}
                onChange={(_, value) => value && addRecipeItem(value)}
              />
            )}

            {addItemType === QuotationItemType.INGREDIENT && (
              <Autocomplete
                options={ingredients}
                getOptionLabel={(option) =>
                  `${option.name} (${option.metric?.abbrv || ''})`
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('quotations.form.selectIngredient')}
                  />
                )}
                onChange={(_, value) => value && addIngredientItem(value)}
              />
            )}

            {(
              [
                QuotationItemType.LABOR,
                QuotationItemType.DELIVERY,
                QuotationItemType.WATER,
                QuotationItemType.BAKE_TIME,
              ] as readonly QuotationItemType[]
            ).includes(addItemType) && (
              <Button
                variant="contained"
                onClick={() => addVariableCostItem(addItemType)}
                disabled={!calcParams}
              >
                {t('quotations.form.addVariableCost')}
              </Button>
            )}

            {addItemType === QuotationItemType.CUSTOM && (
              <Button variant="contained" onClick={addCustomItem}>
                {t('quotations.form.addCustomItem')}
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuotationForm;
