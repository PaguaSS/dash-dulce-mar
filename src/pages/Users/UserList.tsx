import React, { useEffect, useState } from 'react';
import { useUserStore } from '../../store/userStore';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../components/ConfirmationModal';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import toast from 'react-hot-toast';

const UserList: React.FC = () => {
  const { users, loading, error, fetchUsers, deleteUser } = useUserStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
    const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [page] = useState(1); // setPage unused for now
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers(page);
  }, [page, fetchUsers]);

  const handleDeleteClick = (id: string) => {
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete);
        toast.success(t('common.messages.deleteSuccess'));
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      } catch (err) {
        toast.error(t('common.messages.operationFailed'));
      }
    }
  };

  if (loading && users.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" color="text.primary">
          {t('users.title')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size={isMobile ? "small" : "medium"}
          startIcon={<Plus size={20} />}
          onClick={() => navigate('/dashboard/users/new')}
          sx={{ minWidth: isMobile ? 40 : 64 }} 
        >
          {isMobile ? '' : t('users.addUser')}
        </Button>
      </Box>

      {!isMobile ? (
      <TableContainer component={Paper} elevation={1} sx={{ width: '100%', overflow: 'hidden' }}>
        <Table sx={{ minWidth: 650 }} aria-label="user table">
          <TableHead sx={{ bgcolor: '#eff6ff', '& .MuiTableCell-head': { color: '#374151', fontWeight: 600 } }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>{t('auth.username')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('users.status')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('users.createdAt')}</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                  {user.username}
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.active ? t('common.active') : t('common.inactive')}
                    color={user.active ? 'success' : 'error'}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell color="text.secondary">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                     onClick={() => navigate(`/dashboard/users/${user.id}`)}
                     aria-label="edit"
                     size="small"
                     sx={{ mr: 1 }}
                     color="primary"
                  >
                    <Edit size={18} />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteClick(user.id)}
                    aria-label="delete"
                    size="small"
                    color="error"
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  {t('users.noUsers')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {users.map((user) => (
                <Paper key={user.id} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold">{user.username}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </Typography>
                        </Box>
                        <Chip
                            label={user.active ? t('common.active') : t('common.inactive')}
                            color={user.active ? 'success' : 'error'}
                            size="small"
                            variant="outlined"
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/dashboard/users/${user.id}`)}
                            startIcon={<Edit size={16} />}
                        >
                            {t('common.edit')}
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleDeleteClick(user.id)}
                            startIcon={<Trash2 size={16} />}
                        >
                            {t('common.delete')}
                        </Button>
                    </Box>
                </Paper>
            ))}
             {users.length === 0 && !loading && (
                  <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                    {t('users.noUsers')}
                  </Typography>
             )}
        </Box>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title={t('users.deleteTitle')}
        message={t('users.deleteMessage')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isDestructive={true}
      />
    </Box>
  );
};

export default UserList;
