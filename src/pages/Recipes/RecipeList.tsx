import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Edit as EditIcon, Trash2 as DeleteIcon, Plus as PlusIcon, Search as SearchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { recipesService } from '../../services/recipes.service';
import type { Recipe } from '../../services/recipes.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const RecipeList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Search
  const [search, setSearch] = useState('');

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await recipesService.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
      });
      setRecipes(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Error loading recipes', error);
      toast.error(t('common.messages.operationFailed'));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, t]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleDelete = async (id: string) => {
    if (window.confirm(t('recipes.messages.deleteConfirm'))) {
      try {
        await recipesService.delete(id);
        toast.success(t('recipes.messages.deleteSuccess'));
        fetchRecipes();
      } catch (error) {
        console.error('Error deleting recipe', error);
        toast.error(t('common.messages.operationFailed'));
      }
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0); // Reset to first page
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            {t('recipes.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
            {t('recipes.subtitle')}
            </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PlusIcon size={20} />}
          onClick={() => navigate('/dashboard/recipes/new')}
        >
          {t('recipes.create')}
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t('common.search')}
          value={search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon size={20} />
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Paper>

      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#eff6ff' }}>
              <TableRow>
                <TableCell sx={{ color: '#374151', fontWeight: 600 }}>{t('recipes.table.title')}</TableCell>
                <TableCell sx={{ color: '#374151', fontWeight: 600 }}>{t('recipes.table.itemsCount')}</TableCell>
                <TableCell sx={{ color: '#374151', fontWeight: 600 }}>{t('recipes.table.createdAt')}</TableCell>
                <TableCell sx={{ color: '#374151', fontWeight: 600 }} align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : recipes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">{t('recipes.messages.noRecipes')}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                recipes.map((recipe) => (
                  <TableRow key={recipe.id} hover>
                    <TableCell>{recipe.title}</TableCell>
                    <TableCell>
                        <Chip label={recipe.ingredients?.length || 0} size="small" />
                    </TableCell>
                    <TableCell>
                        {recipe.createdAt ? format(new Date(recipe.createdAt), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/dashboard/recipes/${recipe.id}`)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon size={18} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(recipe.id)}
                      >
                        <DeleteIcon size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={t('common.rowsPerPage')}
        />
      </Paper>
    </Box>
  );
};

export default RecipeList;
