
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { Edit, Trash2, Plus } from 'lucide-react';
import { metricService, type Metric, type CreateMetricDto } from '../../../services/metric.service';
import MetricForm from './MetricForm';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from '../../../components/ConfirmationModal';

const MetricList: React.FC = () => {
  const { t } = useTranslation();
  
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [metricToDelete, setMetricToDelete] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await metricService.getAll(
        paginationModel.page + 1,
        paginationModel.pageSize
      );
      setMetrics(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error(error);
      toast.error(t('common.errorLoading', 'Error loading data'));
    } finally {
      setLoading(false);
    }
  }, [paginationModel, t]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const handleCreate = () => {
    setEditingMetric(null);
    setIsFormOpen(true);
  };

  const handleEdit = (metric: Metric) => {
    setEditingMetric(metric);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setMetricToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (metricToDelete) {
      try {
        await metricService.delete(metricToDelete);
        toast.success(t('common.deleteSuccess', 'Deleted successfully'));
        fetchMetrics();
      } catch (error) {
        console.error(error);
        toast.error(t('common.deleteError', 'Error deleting item'));
      } finally {
        setIsDeleteModalOpen(false);
        setMetricToDelete(null);
      }
    }
  };

  const handleFormSubmit = async (data: CreateMetricDto) => {
    setFormLoading(true);
    try {
      if (editingMetric) {
        await metricService.update(editingMetric.id, data);
        toast.success(t('common.updateSuccess', 'Updated successfully'));
      } else {
        await metricService.create(data);
        toast.success(t('common.createSuccess', 'Created successfully'));
      }
      setIsFormOpen(false);
      fetchMetrics();
    } catch (error) {
      console.error(error);
      toast.error(t('common.saveError', 'Error saving data'));
    } finally {
      setFormLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'title', headerName: t('metrics.table.title', 'Title'), flex: 1, minWidth: 150 },
    { field: 'abbrv', headerName: t('metrics.table.abbrv', 'Abbreviation'), flex: 0.5, minWidth: 100 },
    {
      field: 'actions',
      headerName: t('common.actions', 'Actions'),
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title={t('common.edit')}>
            <IconButton onClick={() => handleEdit(params.row as Metric)} size="small" color="primary" aria-label={t('common.edit')}>
              <Edit size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.delete')}>
            <IconButton onClick={() => handleDeleteClick(params.row.id)} size="small" color="error" aria-label={t('common.delete')}>
              <Trash2 size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={handleCreate}
        >
          {t('common.create', 'Create')}
        </Button>
      </Box>

      <Paper elevation={1} sx={{ width: '100%', overflow: 'hidden' }}>
        <DataGrid
            rows={metrics}
            columns={columns}
            rowCount={total}
            loading={loading}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            paginationMode="server"
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
        />
      </Paper>

      <MetricForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingMetric}
        loading={formLoading}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title={t('common.confirmDelete', 'Are you sure?')}
        message={t('common.deleteWarning', "You won't be able to revert this!")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        confirmText={t('common.yesDelete', 'Yes, delete it')}
        isDestructive={true}
      />
    </Box>
  );
};

export default MetricList;
