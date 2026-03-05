
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
import { ingredientService, type Ingredient, type CreateIngredientDto } from '../../../services/ingredient.service';

import IngredientForm from './IngredientForm';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { useConfigStore } from '../../../store/configStore';

const IngredientList: React.FC = () => {
  const { t } = useTranslation();
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState<string | null>(null);

  const currencySign = useConfigStore((state) => state.currencySign);

  const fetchIngredients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ingredientService.getAll(
        paginationModel.page + 1,
        paginationModel.pageSize
      );
      setIngredients(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error(error);
      toast.error(t('common.errorLoading', 'Error loading data'));
    } finally {
      setLoading(false);
    }
  }, [paginationModel, t]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);



  const handleCreate = () => {
    setEditingIngredient(null);
    setIsFormOpen(true);
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setIngredientToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (ingredientToDelete) {
      try {
        await ingredientService.delete(ingredientToDelete);
        toast.success(t('common.deleteSuccess', 'Deleted successfully'));
        fetchIngredients();
      } catch (error) {
        console.error(error);
        toast.error(t('common.deleteError', 'Error deleting item'));
      } finally {
        setIsDeleteModalOpen(false);
        setIngredientToDelete(null);
      }
    }
  };

  const handleFormSubmit = async (data: CreateIngredientDto) => {
    setFormLoading(true);
    try {
      if (editingIngredient) {
        await ingredientService.update(editingIngredient.id, data);
        toast.success(t('common.updateSuccess', 'Updated successfully'));
      } else {
        await ingredientService.create(data);
        toast.success(t('common.createSuccess', 'Created successfully'));
      }
      setIsFormOpen(false);
      fetchIngredients();
    } catch (error) {
      console.error(error);
      toast.error(t('common.saveError', 'Error saving data'));
    } finally {
      setFormLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: t('ingredients.table.name', 'Name'), flex: 1, minWidth: 150 },
    { 
      field: 'price', 
      headerName: t('ingredients.table.price', 'Price'), 
      flex: 0.5, 
      minWidth: 100,
      renderCell: (params: GridRenderCellParams) => `${currencySign}${Number(params.value).toFixed(2)}`
    },
    { 
      field: 'metric', 
      headerName: t('ingredients.table.metric', 'Metric'), 
      flex: 0.5, 
      minWidth: 100,
      valueGetter: (_value, row) => {
         if (row.metric) {
             return `${row.metric.title} (${row.metric.abbrv})`;
         }
         return '';
      }
    },
    {
      field: 'actions',
      headerName: t('common.actions', 'Actions'),
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title={t('common.edit')}>
            <IconButton onClick={() => handleEdit(params.row as Ingredient)} size="small" color="primary" aria-label={t('common.edit')}>
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
            rows={ingredients}
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

      <IngredientForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingIngredient}
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

export default IngredientList;
