import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Typography,
  Chip,
  CircularProgress,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Edit, Trash2, Plus, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { socialNetService, type SocialNet } from '../../services/social-net.service';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../../components/ConfirmationModal';

const SocialNetList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [socialNets, setSocialNets] = useState<SocialNet[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchSocialNets = async () => {
    try {
      setLoading(true);
      const data = await socialNetService.getAll();
      setSocialNets(data.data);
    } catch (error) {
      toast.error('Failed to load social networks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialNets();
  }, []);

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      try {
        await socialNetService.delete(deleteId);
        toast.success(t('common.deleteSuccess', 'Deleted successfully'));
        fetchSocialNets();
      } catch (error) {
        toast.error(t('common.deleteError', 'Failed to delete'));
      }
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant={isMobile ? "h5" : "h4"}>{t('socialNets.title')}</Typography>
        <Button
          variant="contained"
          size={isMobile ? "small" : "medium"}
          startIcon={<Plus />}
          onClick={() => navigate('/dashboard/social-nets/new')}
          sx={{ minWidth: isMobile ? 40 : 64 }}
        >
          {isMobile ? '' : t('socialNets.add')}
        </Button>
      </Box>

      {!isMobile ? (
      <TableContainer component={Paper} sx={{ width: '100%', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#eff6ff', '& .MuiTableCell-head': { color: '#374151', fontWeight: 600 } }}>
            <TableRow>
              <TableCell>{t('socialNets.table.title')}</TableCell>
              <TableCell>{t('socialNets.table.profileName')}</TableCell>
              <TableCell>{t('socialNets.table.src')}</TableCell>
              <TableCell>{t('socialNets.table.status')}</TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {socialNets.map((net) => (
              <TableRow key={net.id}>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Globe size={16} />
                        {net.title}
                    </Box>
                </TableCell>
                <TableCell>{net.profileName}</TableCell>
                <TableCell sx={{ maxWidth: 200 }}>
                    <Tooltip title={net.src || ''}>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                            {net.src || '-'}
                        </Typography>
                    </Tooltip>
                </TableCell>
                <TableCell>
                  <Chip
                    label={net.active ? t('common.active') : t('common.inactive')}
                    color={net.active ? 'success' : 'error'}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title={t('common.edit')}>
                    <IconButton 
                        onClick={() => navigate(`/dashboard/social-nets/${net.id}`)}
                        color="primary"
                        size="small"
                    >
                      <Edit size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.delete')}>
                    <IconButton 
                        color="error" 
                        onClick={() => handleDeleteClick(net.id)}
                        size="small"
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {socialNets.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} align="center">
                        <Typography color="textSecondary" py={3}>{t('common.noData')}</Typography>
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {socialNets.map((net) => (
                 <Paper key={net.id} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Globe size={18} />
                            <Typography variant="subtitle1" fontWeight="bold">{net.title}</Typography>
                        </Box>
                        <Chip
                            label={net.active ? t('common.active') : t('common.inactive')}
                            color={net.active ? 'success' : 'error'}
                            size="small"
                            variant="outlined"
                        />
                    </Box>
                    <Box sx={{ pl: 3.5 }}> {/* Indent to align with title text not icon */}
                        <Typography variant="body2">{net.profileName}</Typography>
                        {net.src && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block', wordBreak: 'break-all' }}>
                                {net.src}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/dashboard/social-nets/${net.id}`)}
                            startIcon={<Edit size={16} />}
                        >
                            {t('common.edit')}
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleDeleteClick(net.id)}
                            startIcon={<Trash2 size={16} />}
                        >
                            {t('common.delete')}
                        </Button>
                     </Box>
                 </Paper>
            ))}
            {socialNets.length === 0 && (
                <Typography align="center" color="textSecondary" py={3}>
                    {t('common.noData')}
                </Typography>
            )}
        </Box>
      )}


      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title={t('common.delete')}
        message={t('common.confirmDelete')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isDestructive={true}
      />
    </Box>
  );
};

export default SocialNetList;
