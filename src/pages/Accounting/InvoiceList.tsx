import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Card,
  Grid,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { Edit, Trash2, Plus, Search, DollarSign, CreditCard } from 'lucide-react';
import { invoiceService, type Invoice, type SalesSummary, type PaymentMethod, type SaleSource } from '../../services/invoice.service';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../components/ConfirmationModal';

const InvoiceList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await invoiceService.getAll({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
      });
      setInvoices(response.data);
      setTotal(response.meta.total);
    } catch (error) {
      console.error(error);
      toast.error(t('common.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [paginationModel, t]);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await invoiceService.getSummary();
      setSummary(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchSummary();
  }, [fetchInvoices, fetchSummary]);

  const handleDeleteClick = (id: string) => {
    setInvoiceToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (invoiceToDelete) {
      try {
        await invoiceService.remove(invoiceToDelete);
        toast.success(t('common.deleteSuccess'));
        fetchInvoices();
        fetchSummary();
      } catch (error) {
        console.error(error);
        toast.error(t('common.deleteError'));
      } finally {
        setIsDeleteModalOpen(false);
        setInvoiceToDelete(null);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const columns: GridColDef[] = [
    { field: 'serialNumber', headerName: t('accounting.table.serialNumber'), width: 150 },
    { field: 'description', headerName: t('accounting.table.description'), flex: 1, minWidth: 200 },
    {
      field: 'client',
      headerName: t('accounting.table.client'),
      flex: 0.8,
      minWidth: 150,
      valueGetter: (_value, row) => {
        const client = row.client;
        if (!client) return '-';
        return `${client.name} ${client.lastname || ''}`.trim();
      },
    },
    {
      field: 'total',
      headerName: t('accounting.table.total'),
      width: 140,
      valueGetter: (value) => Number(value),
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography fontWeight="bold" color="primary">
            {formatCurrency(params.value)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'paymentMethod',
      headerName: t('accounting.table.paymentMethod'),
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={t(`accounting.paymentMethods.${params.value as PaymentMethod}`)} size="small" variant="outlined" />
      ),
    },
    {
      field: 'source',
      headerName: t('accounting.table.source'),
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip 
          label={t(`accounting.sources.${params.value as SaleSource}`)} 
          size="small" 
          color="info" 
          variant="outlined" 
          sx={{ textTransform: 'capitalize' }} 
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: t('accounting.table.createdAt'),
      width: 120,
      valueGetter: (value) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title={t('common.edit')}>
            <IconButton
              onClick={() => navigate(`/dashboard/accounting/${params.row.id}/edit`)}
              size="small"
              color="primary"
              aria-label={t('common.edit')}
            >
              <Edit size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.delete')}>
            <IconButton
              onClick={() => handleDeleteClick(params.row.id)}
              size="small"
              color="error"
              aria-label={t('common.delete')}
            >
              <Trash2 size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {t('accounting.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('accounting.subtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => navigate('/dashboard/accounting/new')}
        >
          {t('common.create')}
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)' }}>
              <DollarSign size={32} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>{t('accounting.cards.totalSales')}</Typography>
              <Typography variant="h5" fontWeight="bold">
                {summary ? formatCurrency(summary.totalSold) : '...'}
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CreditCard size={20} color="gray" />
              <Typography variant="subtitle2" color="text.secondary">{t('accounting.cards.byPaymentMethod')}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {summary && Object.entries(summary.byPaymentMethod).map(([method, amount]) => (
                <Box key={method} sx={{ px: 2, py: 1, borderRadius: 1, border: '1px solid #eee', bgcolor: '#fafafa' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {t(`accounting.paymentMethods.${method as PaymentMethod}`)}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(amount)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={1} sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 2 }}>
          <TextField
            placeholder={t('common.search')}
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: 300 }}
          />
        </Box>
        <DataGrid
          rows={invoices}
          columns={columns}
          rowCount={total}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          paginationMode="server"
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
          localeText={{
            noRowsLabel: t('accounting.noRows'),
          }}
        />
      </Paper>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title={t('common.confirmDelete')}
        message={t('common.deleteWarning')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        confirmText={t('common.yesDelete')}
        isDestructive={true}
      />
    </Box>
  );
};

export default InvoiceList;
