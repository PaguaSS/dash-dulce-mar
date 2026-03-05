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
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import { clientService, type Client, type CreateClientDto } from '../../services/client.service';
import ClientForm from './ClientForm';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from '../../components/ConfirmationModal';

const ClientList: React.FC = () => {
  const { t } = useTranslation();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await clientService.getAll(
        paginationModel.page + 1,
        paginationModel.pageSize,
        search
      );
      setClients(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error(error);
      toast.error(t('common.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [paginationModel, search, t]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPaginationModel(prev => ({ ...prev, page: 0 }));
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleCreate = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setClientToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (clientToDelete) {
      try {
        await clientService.delete(clientToDelete);
        toast.success(t('common.deleteSuccess'));
        fetchClients();
      } catch (error) {
        console.error(error);
        toast.error(t('common.deleteError'));
      } finally {
        setIsDeleteModalOpen(false);
        setClientToDelete(null);
      }
    }
  };

  const handleFormSubmit = async (data: CreateClientDto) => {
    setFormLoading(true);
    try {
      if (editingClient) {
        await clientService.update(editingClient.id, data);
        toast.success(t('common.updateSuccess'));
      } else {
        await clientService.create(data);
        toast.success(t('common.createSuccess'));
      }
      setIsFormOpen(false);
      fetchClients();
    } catch (error) {
      console.error(error);
      toast.error(t('common.saveError', 'Error saving data'));
    } finally {
      setFormLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: t('clients.table.name'), flex: 1, minWidth: 120 },
    { field: 'lastname', headerName: t('clients.table.lastname'), flex: 1, minWidth: 120 },
    { field: 'phone', headerName: t('clients.table.phone'), flex: 0.8, minWidth: 100 },
    { field: 'email', headerName: t('clients.table.email'), flex: 1, minWidth: 150 },
    {
      field: 'actions',
      headerName: t('common.actions'),
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title={t('common.edit')}>
            <IconButton onClick={() => handleEdit(params.row as Client)} size="small" color="primary">
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
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {t('clients.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('clients.subtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={handleCreate}
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
          rows={clients}
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

      <ClientForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingClient}
        loading={formLoading}
      />

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

export default ClientList;
