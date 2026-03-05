import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  TablePagination,
  Breadcrumbs,
  Link as MuiLink,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import {
  Edit,
  Trash2,
  Plus,
  Search,
  Folder,
  Image as ImageIcon,
  FolderOpen,
  Star,
} from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { categoryService } from '../../services/category.service';
import type {
  Category,
  PortfolioItem,
  CategoryFilters,
} from '../../services/category.service';
import { toast } from 'react-hot-toast';

import ConfirmationModal from '../../components/ConfirmationModal';

const CategoryList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');

  // Directory navigation state
  const parentId = searchParams.get('parentCategoryId') || undefined;
  const [parentCategory, setParentCategory] = useState<Category | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PortfolioItem | null>(null);
  const [deleteStep, setDeleteStep] = useState<'INITIAL' | 'RECURSIVE'>(
    'INITIAL',
  );
  const [deleteMessage, setDeleteMessage] = useState('');

  // isTop loading state
  const [togglingIsTopId, setTogglingIsTopId] = useState<string | null>(null);

  const fetchParentInfo = async (id: string) => {
    try {
      const cat = await categoryService.getOne(id);
      setParentCategory(cat);
    } catch (error) {
      console.error(error);
    }
  };

  const loadContents = React.useCallback(async () => {
    setLoading(true);
    try {
      // Logic: If searching, do global search (omit parentId).
      // If browsing (no search), strict parentId filter (null for root).
      const requestParams: CategoryFilters = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
      };

      if (!searchTerm) {
        requestParams.parentId = parentId || 'null';
      }

      const response = await categoryService.getContents(requestParams);

      setItems(response.data);
      setTotal(response.meta.total);

      if (parentId) {
        await fetchParentInfo(parentId);
      } else {
        setParentCategory(null);
      }
    } catch (_error) {
      toast.error(t('common.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, parentId, t]);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  const handleDeleteClick = (item: PortfolioItem) => {
    setItemToDelete(item);
    setDeleteStep('INITIAL');
    setDeleteMessage(t('common.confirmDelete', 'Are you sure?'));
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      try {
        if (itemToDelete.type === 'CATEGORY') {
          await categoryService.delete(
            itemToDelete.id,
            deleteStep === 'RECURSIVE',
          );
        } else {
          await categoryService.deleteItem(itemToDelete.id);
        }
        toast.success(t('common.deleteSuccess'));
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        loadContents();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.response?.status === 409 && deleteStep === 'INITIAL') {
          const { childrenCount, itemsCount } = error.response.data.data;
          setDeleteStep('RECURSIVE');
          setDeleteMessage(
            t('portfolio.deleteRecursiveMessage', {
              childrenCount,
              itemsCount,
            }),
          );
          return;
        }
        toast.error(t('common.deleteError'));
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      }
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleNavigateFolder = (id: string) => {
    setSearchParams({ parentCategoryId: id });
    setPage(0);
  };

  const handleNavigateRoot = () => {
    setSearchParams({});
    setPage(0);
  };

  const getAssetPath = (item: PortfolioItem) => {
    const folder = item.type === 'CATEGORY' ? 'categories' : 'category-items';
    return `${import.meta.env.VITE_ASSETS_URL || 'http://localhost:3000/assets'}/${folder}/${item.image}`;
  };

  const handleEdit = (item: PortfolioItem) => {
    if (item.type === 'CATEGORY') {
      navigate(`/dashboard/portfolio/${item.id}`);
    } else {
      navigate(`/dashboard/portfolio/items/${item.id}`);
    }
  };

  const handleToggleIsTop = async (item: PortfolioItem) => {
    if (item.type !== 'ITEM') return;
    setTogglingIsTopId(item.id);
    try {
      await categoryService.updateItemIsTop(item.id, !item.isTop);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isTop: !i.isTop } : i)),
      );
      toast.success(t('common.updateSuccess'));
    } catch (_error) {
      toast.error(t('common.updateError'));
    } finally {
      setTogglingIsTopId(null);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom>
            {t('portfolio.title')}
          </Typography>
          <Breadcrumbs aria-label="breadcrumb">
            <MuiLink
              component="button"
              underline="hover"
              color="inherit"
              onClick={handleNavigateRoot}
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <FolderOpen size={16} style={{ marginRight: 4 }} />
              {!isMobile && t('common.root')}
            </MuiLink>
            {parentCategory && (
              <Typography color="text.primary">
                {parentCategory.title}
              </Typography>
            )}
          </Breadcrumbs>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {parentId && (
            <Button
              variant="outlined"
              size={isMobile ? 'small' : 'medium'}
              startIcon={<Plus />}
              onClick={() =>
                navigate(
                  `/dashboard/portfolio/items/new?categoryId=${parentId}`,
                )
              }
              sx={{ minWidth: isMobile ? 40 : 64 }}
            >
              {isMobile ? '' : t('portfolio.addItem')}
            </Button>
          )}
          <Button
            variant="contained"
            size={isMobile ? 'small' : 'medium'}
            startIcon={<Plus />}
            onClick={() =>
              navigate(
                parentId
                  ? `/dashboard/portfolio/new?parentCategoryId=${parentId}`
                  : '/dashboard/portfolio/new',
              )
            }
            sx={{ minWidth: isMobile ? 40 : 64 }}
          >
            {isMobile ? '' : t('portfolio.addCategory')}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t('portfolio.search')}
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Paper>

      {loading && items.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {!isMobile ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead
                  sx={{
                    bgcolor: '#eff6ff',
                    '& .MuiTableCell-head': {
                      color: '#374151',
                      fontWeight: 600,
                    },
                  }}
                >
                  <TableRow>
                    <TableCell width={80}>{t('common.image')}</TableCell>
                    <TableCell>{t('common.title')}</TableCell>
                    <TableCell width={100} align="center">
                      {t('common.type')}
                    </TableCell>
                    <TableCell>{t('common.description')}</TableCell>
                    <TableCell width={100} align="center">
                      {t('common.active')}
                    </TableCell>
                    <TableCell width={80} align="center">
                      {t('common.top')}
                    </TableCell>
                    <TableCell width={120} align="right">
                      {t('common.actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.id || index} hover>
                      <TableCell>
                        {item.image ? (
                          <Box
                            component="img"
                            src={getAssetPath(item)}
                            alt={item.title}
                            sx={{
                              width: 50,
                              height: 50,
                              objectFit: 'cover',
                              borderRadius: 1,
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 50,
                              height: 50,
                              bgcolor: 'action.hover',
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {item.type === 'CATEGORY' ? (
                              <Folder size={24} color="#FFCDD2" />
                            ) : (
                              <ImageIcon size={24} color="#9e9e9e" />
                            )}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          {item.type === 'CATEGORY' ? (
                            <Link
                              to={`?parentCategoryId=${item.id}`}
                              onClick={(e) => {
                                e.preventDefault();
                                handleNavigateFolder(item.id);
                              }}
                              style={{
                                textDecoration: 'none',
                                color: 'inherit',
                                display: 'flex',
                                alignItems: 'center',
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              <Folder
                                size={18}
                                style={{
                                  marginRight: 8,
                                  fill: '#FFCDD2',
                                  stroke: '#E91E63',
                                }}
                              />
                              {item.title}
                            </Link>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ImageIcon
                                size={18}
                                style={{ marginRight: 8, color: '#666' }}
                              />
                              {item.title}
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={
                            item.type === 'CATEGORY'
                              ? t('portfolio.folder')
                              : t('portfolio.item')
                          }
                          size="small"
                          variant="filled"
                          color={
                            item.type === 'CATEGORY' ? 'secondary' : 'default'
                          }
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </TableCell>
                      <TableCell>{item.description || '-'}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={
                            item.active
                              ? t('common.active')
                              : t('common.inactive')
                          }
                          color={item.active ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {item.type === 'ITEM' ? (
                          togglingIsTopId === item.id ? (
                            <CircularProgress size={18} />
                          ) : (
                            <Tooltip
                              title={
                                item.isTop
                                  ? t('common.removeFromTop')
                                  : t('common.markAsTop')
                              }
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleToggleIsTop(item)}
                                sx={{
                                  color: item.isTop ? 'warning.main' : 'grey.400',
                                }}
                              >
                                <Star
                                  size={18}
                                  fill={item.isTop ? 'currentColor' : 'none'}
                                />
                              </IconButton>
                            </Tooltip>
                          )
                        ) : (
                          <Typography color="text.disabled">-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={t('common.edit')}>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteClick(item)}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography color="textSecondary">
                          {t('common.noData')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[10, 20, 50]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableContainer>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {items.map((item) => (
                <Paper
                  key={item.id}
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {item.image ? (
                      <Box
                        component="img"
                        src={getAssetPath(item)}
                        alt={item.title}
                        sx={{
                          width: 60,
                          height: 60,
                          objectFit: 'cover',
                          borderRadius: 1,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {item.type === 'CATEGORY' ? (
                          <Folder size={30} color="#FFCDD2" />
                        ) : (
                          <ImageIcon size={30} color="#9e9e9e" />
                        )}
                      </Box>
                    )}
                    <Box sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        {item.type === 'CATEGORY' ? (
                          <Link
                            to={`?parentCategoryId=${item.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavigateFolder(item.id);
                            }}
                            style={{
                              textDecoration: 'none',
                              color: 'inherit',
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <Typography fontWeight="bold">
                            {item.title}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.type === 'ITEM' && (
                            togglingIsTopId === item.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <IconButton
                                size="small"
                                onClick={() => handleToggleIsTop(item)}
                                sx={{
                                  color: item.isTop ? 'warning.main' : 'grey.400',
                                  p: 0,
                                }}
                              >
                                <Star
                                  size={16}
                                  fill={item.isTop ? 'currentColor' : 'none'}
                                />
                              </IconButton>
                            )
                          )}
                          <Chip
                            label={
                              item.active
                                ? t('common.active')
                                : t('common.inactive')
                            }
                            color={item.active ? 'success' : 'error'}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        {item.type === 'CATEGORY'
                          ? t('portfolio.folder')
                          : t('portfolio.item')}
                      </Typography>
                      {item.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          noWrap
                          sx={{ mt: 0.5 }}
                        >
                          {item.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleEdit(item)}
                      startIcon={<Edit size={16} />}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDeleteClick(item)}
                      startIcon={<Trash2 size={16} />}
                    >
                      {t('common.delete')}
                    </Button>
                  </Box>
                </Paper>
              ))}
              {items.length === 0 && !loading && (
                <Typography
                  align="center"
                  color="text.secondary"
                  sx={{ py: 3 }}
                >
                  {t('common.noData')}
                </Typography>
              )}
              <TablePagination
                rowsPerPageOptions={[10, 20]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Box>
          )}

          <ConfirmationModal
            isOpen={isDeleteModalOpen}
            title={
              deleteStep === 'RECURSIVE'
                ? t('portfolio.recursiveDelete')
                : t('portfolio.deleteTitle')
            }
            message={deleteMessage}
            onConfirm={handleConfirmDelete}
            onCancel={() => setIsDeleteModalOpen(false)}
            confirmText={t('common.delete')}
            cancelText={t('common.cancel')}
            isDestructive={true}
          />
        </>
      )}
    </Box>
  );
};

export default CategoryList;
