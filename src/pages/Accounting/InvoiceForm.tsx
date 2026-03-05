import React, { useEffect, useState, useMemo } from 'react';
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
  Switch,
  Grid,
} from '@mui/material';
import { Plus, Trash2, Save, Printer, FileText } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import BackButton from '../../components/common/BackButton';
import { quotationService, QuotationItemType } from '../../services/quotation.service';
import { clientService, type Client } from '../../services/client.service';
import { recipesService, type Recipe } from '../../services/recipes.service';
import { ingredientService, type Ingredient } from '../../services/ingredient.service';
import { calculatorParamsService, type CalculatorParams } from '../../services/calculatorParams.service';
import { invoiceService, PaymentMethod, SaleSource, type CreateInvoiceDto, type InvoiceItem } from '../../services/invoice.service';
import PrintConfigDialog from './Components/PrintConfigDialog';
import PrintInvoiceTemplate from './Components/PrintInvoiceTemplate';
import { LayoutGrid } from 'lucide-react';

interface FormItem extends Omit<InvoiceItem, 'id'> {
  tempId: string;
}

const InvoiceForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const quotationIdFromQuery = searchParams.get('quotationId');
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [quotationId, setQuotationId] = useState<string | null>(quotationIdFromQuery);
  const [taxRate, setTaxRate] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [source, setSource] = useState<SaleSource>(SaleSource.DASHBOARD);
  const [items, setItems] = useState<FormItem[]>([]);
  const [serialNumber, setSerialNumber] = useState('');

  // Print state
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printItems, setPrintItems] = useState<FormItem[]>([]);

  // Data for dropdowns
  const [clients, setClients] = useState<Client[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [calcParams, setCalcParams] = useState<CalculatorParams | null>(null);

  // Add item dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addItemType, setAddItemType] = useState<QuotationItemType>(QuotationItemType.RECIPE);

  // Calculated totals
  const subtotal = useMemo(() => items.reduce((sum, item) => item.isIncluded ? sum + Number(item.subtotal) : sum, 0), [items]);
  const tax = useMemo(() => subtotal * (taxRate / 100), [subtotal, taxRate]);
  
  const deliverySubtotal = useMemo(() => items
    .filter((item) => item.isIncluded && item.type === QuotationItemType.DELIVERY)
    .reduce((sum, item) => sum + Number(item.subtotal), 0), [items]);

  const subtotalWithoutDelivery = subtotal - deliverySubtotal;
  const baseForProfit = subtotalWithoutDelivery * (1 + taxRate / 100);
  const profit = useMemo(() => baseForProfit * (profitMargin / 100), [baseForProfit, profitMargin]);

  const total = useMemo(() => subtotal + tax + profit, [subtotal, tax, profit]);

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
        const [clientsRes, recipesRes, ingredientsRes, paramsRes] = await Promise.all([
          clientService.getAll(1, 100),
          recipesService.getAll({ limit: 100 }),
          ingredientService.getAll(1, 100),
          calculatorParamsService.get(),
        ]);
        setClients(clientsRes.data);
        setRecipes(recipesRes.data);
        setIngredients(ingredientsRes.data);
        setCalcParams(paramsRes);
        
        if (!isEditMode && paramsRes.crFee !== undefined && !quotationIdFromQuery) {
          const crFeeValue = Number(paramsRes.crFee);
          setTaxRate(crFeeValue <= 1 ? crFeeValue * 100 : crFeeValue);
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
        toast.error(t('common.errorLoading'));
      }
    };
    fetchData();
  }, [t, isEditMode, quotationIdFromQuery]);

  // Load from Quotation if quotationId exists
  useEffect(() => {
    if (quotationIdFromQuery && !isEditMode) {
      const loadQuotation = async () => {
        try {
          const q = await quotationService.getOne(quotationIdFromQuery);
          setDescription(q.description);
          setTaxRate(Number(q.taxRate));
          setProfitMargin(Number(q.profitMargin));
          setQuotationId(q.id);
          
          if (q.clientId) {
            const client = clients.find(c => c.id === q.clientId);
            if (client) setSelectedClient(client);
          }

          setItems(q.items.map((item, idx) => ({
            tempId: `quote-${idx}`,
            type: item.type,
            itemReferenceId: item.itemReferenceId || null,
            name: item.name,
            quantity: Number(item.quantity),
            metric: item.metric || null,
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
            isIncluded: true,
            metadata: item.metadata || null,
          })));
        } catch (error) {
          console.error("Failed to load quotation", error);
        }
      };
      if (clients.length > 0) loadQuotation();
    }
  }, [quotationIdFromQuery, isEditMode, clients]);

  // Fetch invoice if editing
  useEffect(() => {
    if (isEditMode && id) {
      const fetchInvoice = async () => {
        setFetching(true);
        try {
          const inv = await invoiceService.getOne(id);
          setDescription(inv.description);
          setTaxRate(Number(inv.taxRate));
          setProfitMargin(Number(inv.profitMargin));
          setPaymentMethod(inv.paymentMethod);
          setSource(inv.source);
          setQuotationId(inv.quotationId);
          setSerialNumber(inv.serialNumber);
          
          const client = clients.find((c) => c.id === inv.clientId) || null;
          setSelectedClient(client);
          
          setItems(inv.items.map((item: any) => ({
            tempId: `existing-${item.id}`,
            type: item.type,
            itemReferenceId: item.itemReferenceId || null,
            name: item.name,
            quantity: Number(item.quantity),
            metric: item.metric || null,
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
            isIncluded: item.isIncluded,
            metadata: item.metadata || null,
          })));
        } catch (error) {
          console.error('Failed to fetch invoice', error);
          toast.error(t('common.errorLoading'));
          navigate('/dashboard/accounting');
        } finally {
          setFetching(false);
        }
      };
      if (clients.length > 0) fetchInvoice();
    }
  }, [id, isEditMode, navigate, t, clients]);

  const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addRecipeItem = (recipe: Recipe) => {
    const ingredientsSnapshot = recipe.ingredients.map((item) => ({
      ingredientId: item.ingredientId,
      name: item.ingredient?.name || '',
      qty: Number(item.qty),
      metric: item.ingredient?.metric?.abbrv || '',
      unitPrice: Number(item.ingredient?.price || 0),
      subtotal: Number(item.qty) * Number(item.ingredient?.price || 0),
    }));

    const calculatedPrice = ingredientsSnapshot.reduce((sum, i) => sum + i.subtotal, 0);

    const newItem: FormItem = {
      tempId: generateTempId(),
      type: QuotationItemType.RECIPE,
      itemReferenceId: recipe.id,
      name: recipe.title,
      quantity: 1,
      metric: t('quotations.metrics.unit'),
      unitPrice: calculatedPrice,
      subtotal: calculatedPrice,
      isIncluded: true,
      metadata: { recipeId: recipe.id, servings: recipe.servings, ingredients: ingredientsSnapshot },
    };
    setItems([...items, newItem]);
    setAddDialogOpen(false);
  };

  const addIngredientItem = (ingredient: Ingredient) => {
    const unitPrice = Number(ingredient.price);
    const newItem: FormItem = {
      tempId: generateTempId(),
      type: QuotationItemType.INGREDIENT,
      itemReferenceId: ingredient.id,
      name: ingredient.name,
      quantity: 1,
      metric: ingredient.metric?.abbrv || '',
      unitPrice,
      subtotal: unitPrice,
      isIncluded: true,
      metadata: { ingredientId: ingredient.id },
    };
    setItems([...items, newItem]);
    setAddDialogOpen(false);
  };

  const addVariableCostItem = (type: QuotationItemType) => {
    if (!calcParams) return;
    let name = ''; let metric = ''; let unitPrice = 0;
    switch (type) {
      case QuotationItemType.LABOR: name = t('quotations.variableCosts.bakerPay'); metric = t('quotations.metrics.hours'); unitPrice = calcParams.bakerPayPerHour; break;
      case QuotationItemType.DELIVERY: name = t('quotations.variableCosts.delivery'); metric = 'km'; unitPrice = calcParams.gasPricePerLt / calcParams.averageKmPerLitre; break;
      case QuotationItemType.WATER: name = t('quotations.variableCosts.water'); metric = t('quotations.metrics.liters'); unitPrice = calcParams.waterPricePerLitre; break;
      case QuotationItemType.BAKE_TIME: name = t('quotations.variableCosts.bakeTime'); metric = t('quotations.metrics.minutes'); unitPrice = calcParams.bakePricePerMin; break;
      default: return;
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
      isIncluded: true,
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
      isIncluded: true,
      metadata: null,
    };
    setItems([...items, newItem]);
    setAddDialogOpen(false);
  };

  const updateItem = (tempId: string, field: keyof FormItem, value: any) => {
    setItems(items.map((item) => {
      if (item.tempId !== tempId) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.subtotal = Number(updated.quantity) * Number(updated.unitPrice);
      }
      return updated;
    }));
  };

  const removeItem = (tempId: string) => setItems(items.filter((item) => item.tempId !== tempId));

  const handleConfirmPrint = (mergedItems: FormItem[]) => {
    setPrintItems(mergedItems);
    setPrintDialogOpen(false);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleSubmit = async () => {
    if (!description.trim() || !selectedClient) {
      toast.error(t('validation.required'));
      return;
    }
    setLoading(true);
    try {
      const payload: CreateInvoiceDto = {
        description,
        clientId: selectedClient.id,
        quotationId,
        taxRate,
        profitMargin,
        subtotal,
        tax,
        profit,
        total,
        paymentMethod,
        source,
        items: items.map(({ tempId, ...rest }) => {
          if (isEditMode && tempId.startsWith('existing-')) {
            return { ...rest, id: tempId.replace('existing-', '') };
          }
          return rest;
        }),
      };

      if (isEditMode && id) {
        await invoiceService.update(id, payload);
        toast.success(t('common.updateSuccess'));
      } else {
        await invoiceService.create(payload);
        toast.success(t('common.createSuccess'));
      }
      navigate('/dashboard/accounting');
    } catch (error) {
      console.error('Failed to save invoice', error);
      toast.error(t('common.saveError'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <BackButton />
        <Typography variant="h4" fontWeight="bold">
          {isEditMode ? t('accounting.edit') : t('accounting.create')}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>{t('accounting.form.details')}</Typography>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <TextField
                  label={t('accounting.form.description')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                  required
                />
                <Autocomplete
                  options={clients}
                  value={selectedClient}
                  onChange={(_, value) => setSelectedClient(value)}
                  getOptionLabel={(option) => `${option.name} ${option.lastname || ''}`.trim()}
                  renderInput={(params) => <TextField {...params} label={t('accounting.form.client')} required />}
                  sx={{ minWidth: 250 }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <TextField
                  select
                  label={t('accounting.form.paymentMethod')}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  fullWidth
                >
                  {Object.values(PaymentMethod).map(m => <MenuItem key={m} value={m}>{t(`accounting.paymentMethods.${m}`)}</MenuItem>)}
                </TextField>
                <TextField
                  select
                  label={t('accounting.form.source')}
                  value={source}
                  onChange={(e) => setSource(e.target.value as SaleSource)}
                  fullWidth
                >
                  {Object.values(SaleSource).map(s => <MenuItem key={s} value={s}>{t(`accounting.sources.${s}`)}</MenuItem>)}
                </TextField>
                {quotationId && (
                  <TextField 
                    label={t('accounting.form.linkedQuotation')} 
                    value={quotationId} 
                    disabled 
                    fullWidth 
                    slotProps={{ input: { startAdornment: <FileText size={18} style={{ marginRight: 8 }} /> } }}
                  />
                )}
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>{t('accounting.form.items')}</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#eff6ff' }}>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ p: 1, fontWeight: 600 }}>{t('accounting.table.included')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('accounting.table.name')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 140 }}>{t('accounting.table.qty')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 120 }}>{t('accounting.table.unitPrice')}</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 120 }}>{t('accounting.table.subtotal')}</TableCell>
                    <TableCell sx={{ width: 60 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.tempId} sx={{ opacity: item.isIncluded ? 1 : 0.5 }}>
                      <TableCell padding="checkbox">
                        <Switch 
                          size="small" 
                          checked={item.isIncluded} 
                          onChange={(e) => updateItem(item.tempId, 'isIncluded', e.target.checked)} 
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          {item.type === QuotationItemType.CUSTOM ? (
                            <TextField
                              size="small"
                              placeholder={t('accounting.table.name')}
                              value={item.name}
                              onChange={(e) => updateItem(item.tempId, 'name', e.target.value)}
                              fullWidth
                            />
                          ) : (
                            <>
                              <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{t(`quotations.itemTypes.${item.type}`)}</Typography>
                            </>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity || ''}
                            onChange={(e) => updateItem(item.tempId, 'quantity', Number(e.target.value) || 0)}
                            sx={{ width: 85 }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                            {item.metric}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {item.type === QuotationItemType.CUSTOM ? (
                          <TextField
                            size="small"
                            type="number"
                            value={item.unitPrice || ''}
                            onChange={(e) => updateItem(item.tempId, 'unitPrice', Number(e.target.value) || 0)}
                            sx={{ width: 90 }}
                          />
                        ) : (
                          formatCurrency(item.unitPrice)
                        )}
                      </TableCell>
                      <TableCell><Typography variant="body2" fontWeight="bold">{formatCurrency(item.subtotal)}</Typography></TableCell>
                      <TableCell>
                        <IconButton size="small" color="error" onClick={() => removeItem(item.tempId)}><Trash2 size={16} /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, mb: 3, position: 'sticky', top: 24 }}>
            <Typography variant="h6" gutterBottom>{t('accounting.totals.summary')}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">{t('accounting.totals.subtotal')}</Typography>
                <Typography fontWeight="medium">{formatCurrency(subtotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography color="text.secondary">{t('accounting.totals.tax')} ({taxRate}%)</Typography>
                <Typography fontWeight="medium">{formatCurrency(tax)}</Typography>
              </Box>
              {profitMargin > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">{t('accounting.totals.profit')} ({profitMargin}%)</Typography>
                  <Typography color="success.main" fontWeight="medium">{formatCurrency(profit)}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight="bold">{t('accounting.totals.total')}</Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">{formatCurrency(total)}</Typography>
              </Box>
              
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  size="large" 
                  startIcon={<Save size={20} />} 
                  onClick={handleSubmit} 
                  disabled={loading}
                >
                  {loading ? t('common.saving') : (isEditMode ? t('common.update') : t('common.save'))}
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<LayoutGrid size={20} />}
                  onClick={() => setPrintDialogOpen(true)}
                  disabled={items.filter(i => i.isIncluded).length < 1}
                >
                  {t('accounting.form.customPrint')}
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<Printer size={20} />}
                  disabled={!isEditMode}
                  onClick={() => {
                    setPrintItems(items.filter(i => i.isIncluded));
                    setTimeout(() => window.print(), 100);
                  }}
                >
                  {t('accounting.form.print')}
                </Button>
                <Button variant="text" fullWidth onClick={() => navigate('/dashboard/accounting')}>
                  {t('common.cancel')}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Floating Add Item Button */}
      <Tooltip title={t('quotations.form.addItem')} placement="left">
        <Fab 
          color="primary" 
          onClick={() => setAddDialogOpen(true)} 
          sx={{ position: 'fixed', bottom: 32, right: 32 }}
          aria-label={t('quotations.form.addItem')}
        >
          <Plus size={24} />
        </Fab>
      </Tooltip>

      {/* Add Item Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('quotations.form.addItem')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select label={t('quotations.form.itemType')} value={addItemType}
              onChange={(e) => setAddItemType(e.target.value as QuotationItemType)} fullWidth
            >
              <MenuItem value={QuotationItemType.RECIPE}>{t('quotations.itemTypes.RECIPE')}</MenuItem>
              <MenuItem value={QuotationItemType.INGREDIENT}>{t('quotations.itemTypes.INGREDIENT')}</MenuItem>
              <MenuItem value={QuotationItemType.LABOR}>{t('quotations.itemTypes.LABOR')}</MenuItem>
              <MenuItem value={QuotationItemType.DELIVERY}>{t('quotations.itemTypes.DELIVERY')}</MenuItem>
              <MenuItem value={QuotationItemType.WATER}>{t('quotations.itemTypes.WATER')}</MenuItem>
              <MenuItem value={QuotationItemType.BAKE_TIME}>{t('quotations.itemTypes.BAKE_TIME')}</MenuItem>
              <MenuItem value={QuotationItemType.CUSTOM}>{t('quotations.itemTypes.CUSTOM')}</MenuItem>
            </TextField>
            {addItemType === QuotationItemType.RECIPE && (
              <Autocomplete options={recipes} getOptionLabel={(option) => option.title}
                renderInput={(params) => <TextField {...params} label={t('quotations.form.selectRecipe')} />}
                onChange={(_, value) => value && addRecipeItem(value)} />
            )}
            {addItemType === QuotationItemType.INGREDIENT && (
              <Autocomplete options={ingredients} getOptionLabel={(option) => `${option.name} (${option.metric?.abbrv || ''})`}
                renderInput={(params) => <TextField {...params} label={t('quotations.form.selectIngredient')} />}
                onChange={(_, value) => value && addIngredientItem(value)} />
            )}
            {(
              [
                QuotationItemType.LABOR,
                QuotationItemType.DELIVERY,
                QuotationItemType.WATER,
                QuotationItemType.BAKE_TIME,
              ] as string[]
            ).includes(addItemType as string) && (
              <Button variant="contained" onClick={() => addVariableCostItem(addItemType)} disabled={!calcParams}>
                {t('quotations.form.addVariableCost')}
              </Button>
            )}
            {addItemType === QuotationItemType.CUSTOM && (
              <Button variant="contained" onClick={addCustomItem}>{t('quotations.form.addCustomItem')}</Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setAddDialogOpen(false)}>{t('common.cancel')}</Button></DialogActions>
      </Dialog>

      <PrintConfigDialog
        open={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        items={items}
        onPrint={handleConfirmPrint}
      />

      <PrintInvoiceTemplate
        description={description}
        client={selectedClient}
        items={printItems}
        subtotal={subtotal}
        tax={tax}
        taxRate={taxRate}
        profit={profit}
        profitMargin={profitMargin}
        total={total}
        paymentMethod={paymentMethod}
        invoiceNumber={serialNumber}
      />
    </Box>
  );
};

export default InvoiceForm;
