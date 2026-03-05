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
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { Edit, Trash2, Plus, Search, Receipt, Copy } from 'lucide-react';
import { quotationService, type Quotation } from '../../services/quotation.service';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../components/ConfirmationModal';

const QuotationList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await quotationService.getAll(
        paginationModel.page + 1,
        paginationModel.pageSize,
        search
      );
      setQuotations(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error(error);
      toast.error(t('common.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [paginationModel, search, t]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPaginationModel(prev => ({ ...prev, page: 0 }));
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleDeleteClick = (id: string) => {
    setQuotationToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (quotationToDelete) {
      try {
        await quotationService.delete(quotationToDelete);
        toast.success(t('common.deleteSuccess'));
        fetchQuotations();
      } catch (error) {
        console.error(error);
        toast.error(t('common.deleteError'));
      } finally {
        setIsDeleteModalOpen(false);
        setQuotationToDelete(null);
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
    { field: 'description', headerName: t('quotations.table.description'), flex: 1, minWidth: 200 },
    {
      field: 'client',
      headerName: t('quotations.table.client'),
      flex: 0.8,
      minWidth: 150,
      valueGetter: (_value, row) => {
        const client = row.client;
        if (!client) return '-';
        return `${client.name} ${client.lastname || ''}`.trim();
      },
    },
    {
      field: 'itemsCount',
      headerName: t('quotations.table.items'),
      width: 100,
      valueGetter: (_value, row) => row.items?.length || 0,
      renderCell: (params: GridRenderCellParams) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    {
      field: 'total',
      headerName: t('quotations.table.total'),
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
      field: 'createdAt',
      headerName: t('quotations.table.createdAt'),
      width: 120,
      valueGetter: (value) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title={t('accounting.createFromQuotation')}>
            <IconButton
              onClick={() => navigate(`/dashboard/accounting/new?quotationId=${params.row.id}`)}
              size="small"
              color="info"
            >
              <Receipt size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.duplicate')}>
            <IconButton
              onClick={() => navigate(`/dashboard/quotations/new?duplicateId=${params.row.id}`)}
              size="small"
              color="secondary"
              aria-label={t('common.duplicate')}
            >
              <Copy size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.edit')}>
            <IconButton
              onClick={() => navigate(`/dashboard/quotations/${params.row.id}/edit`)}
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
            {t('quotations.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('quotations.subtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => navigate('/dashboard/quotations/new')}
        >
          {t('common.create')}
        </Button>
      </Box>

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
          rows={quotations}
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
            noRowsLabel: t('quotations.noRows'),
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

export default QuotationList;
