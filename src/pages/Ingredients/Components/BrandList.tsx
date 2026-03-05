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
import { brandService, type Brand, type CreateBrandDto } from '../../../services/brand.service';
import BrandForm from './BrandForm';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from '../../../components/ConfirmationModal';

const BrandList: React.FC = () => {
  const { t } = useTranslation();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const response = await brandService.getAll(
        paginationModel.page + 1,
        paginationModel.pageSize
      );
      setBrands(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error(error);
      toast.error(t('common.errorLoading', 'Error loading data'));
    } finally {
      setLoading(false);
    }
  }, [paginationModel, t]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleCreate = () => {
    setEditingBrand(null);
    setIsFormOpen(true);
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setBrandToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (brandToDelete) {
      try {
        await brandService.delete(brandToDelete);
        toast.success(t('common.deleteSuccess', 'Deleted successfully'));
        fetchBrands();
      } catch (error) {
        console.error(error);
        toast.error(t('common.deleteError', 'Error deleting item'));
      } finally {
        setIsDeleteModalOpen(false);
        setBrandToDelete(null);
      }
    }
  };

  const handleFormSubmit = async (data: CreateBrandDto) => {
    setFormLoading(true);
    try {
      if (editingBrand) {
        await brandService.update(editingBrand.id, data);
        toast.success(t('common.updateSuccess', 'Updated successfully'));
      } else {
        await brandService.create(data);
        toast.success(t('common.createSuccess', 'Created successfully'));
      }
      setIsFormOpen(false);
      fetchBrands();
    } catch (error) {
      console.error(error);
      toast.error(t('common.saveError', 'Error saving data'));
    } finally {
      setFormLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: t('brands.table.name', 'Name'), flex: 1, minWidth: 150 },
    {
      field: 'actions',
      headerName: t('common.actions', 'Actions'),
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title={t('common.edit')}>
            <IconButton onClick={() => handleEdit(params.row as Brand)} size="small" color="primary">
              <Edit size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.delete')}>
            <IconButton onClick={() => handleDeleteClick(params.row.id)} size="small" color="error">
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
            rows={brands}
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

      <BrandForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingBrand}
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

export default BrandList;
