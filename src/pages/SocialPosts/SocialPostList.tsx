
import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  TablePagination,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Plus, Image as ImageIcon, Video, Send, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { socialPostService, type SocialPost } from '../../services/social-post.service';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { MediaType, PostStatus } from '../../types/social-post.types';

const SocialPostList: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const result = await socialPostService.getAll(page, limit);
            setPosts(result.data);
            setTotalPages(Math.ceil(result.total / limit));
        } catch (error) {
            toast.error(t('socialPosts.messages.loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [page]);

    const handlePublishNow = async (id: string) => {
        if (!confirm(t('socialPosts.messages.confirmPublish'))) return;
        try {
            await socialPostService.publish(id);
            toast.success(t('socialPosts.messages.postPublished'));
            fetchPosts();
        } catch (error) {
            toast.error(t('socialPosts.messages.publishFailed'));
        }
    };

    const getStatusChip = (status: string) => {
        const colors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
            [PostStatus.DRAFT]: 'default',
            [PostStatus.SCHEDULED]: 'info',
            [PostStatus.PUBLISHED]: 'success',
            [PostStatus.FAILED]: 'error'
        };
        const statusKey = status.toLowerCase() as keyof typeof t; 
        return <Chip label={t(`socialPosts.status.${statusKey}` as any)} color={colors[status] || 'default'} size="small" />;
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant={isMobile ? "h5" : "h4"}>{t('socialPosts.title')}</Typography>
                <Button 
                    variant="contained" 
                    size={isMobile ? "small" : "medium"}
                    startIcon={<Plus size={isMobile ? 18 : 20} />} 
                    onClick={() => navigate('/dashboard/social-posts/new')}
                    sx={{ minWidth: isMobile ? 40 : 64 }}
                >
                    {isMobile ? '' : t('socialPosts.create')}
                </Button>
            </Box>

            {!isMobile ? (
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: '#eff6ff', '& .MuiTableCell-head': { color: '#374151', fontWeight: 600 } }}>
                        <TableRow>
                            <TableCell>{t('socialPosts.table.dateCreated')}</TableCell>
                            <TableCell>{t('socialPosts.table.content')}</TableCell>
                            <TableCell>{t('socialPosts.table.media')}</TableCell>
                            <TableCell>{t('socialPosts.table.scheduledFor')}</TableCell>
                            <TableCell>{t('socialPosts.table.status')}</TableCell>
                            <TableCell align="right">{t('socialPosts.table.actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {posts.map((post) => (
                            <TableRow key={post.id}>
                                <TableCell>{format(new Date(post.createdAt), 'yyyy-MM-dd HH:mm')}</TableCell>
                                <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {post.content || '-'}
                                </TableCell>
                                <TableCell>
                                    {post.mediaType === MediaType.IMAGE && <Tooltip title={t('socialPosts.tooltips.image')}><ImageIcon size={20} /></Tooltip>}
                                    {post.mediaType === MediaType.VIDEO && <Tooltip title={t('socialPosts.tooltips.video')}><Video size={20} /></Tooltip>}
                                    {post.mediaType === MediaType.NONE && '-'}
                                </TableCell>
                                <TableCell>
                                    {post.scheduledFor ? format(new Date(post.scheduledFor), 'yyyy-MM-dd HH:mm') : '-'}
                                </TableCell>
                                <TableCell>{getStatusChip(post.status)}</TableCell>
                                <TableCell align="right">
                                    {(post.status === PostStatus.DRAFT || post.status === PostStatus.FAILED || post.status === PostStatus.SCHEDULED) && (
                                         <>
                                            <Tooltip title={t('common.edit')}>
                                                <IconButton size="small" color="primary" onClick={() => navigate(`/dashboard/social-posts/${post.id}`)}>
                                                    <Edit size={18} />
                                                </IconButton>
                                            </Tooltip>
                                            {(post.status === PostStatus.DRAFT || post.status === PostStatus.FAILED) && (
                                            <Tooltip title={t('socialPosts.tooltips.publishNow')}>
                                                <IconButton size="small" color="primary" onClick={() => handlePublishNow(post.id)}>
                                                    <Send size={18} />
                                                </IconButton>
                                            </Tooltip>
                                            )}
                                         </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {posts.length === 0 && !loading && (
                             <TableRow>
                                <TableCell colSpan={6} align="center">{t('socialPosts.table.noPosts')}</TableCell>
                             </TableRow>
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[10, 20, 50]}
                    component="div"
                    count={totalPages * limit}
                    rowsPerPage={limit}
                    page={page - 1}
                    onPageChange={(_, p) => setPage(p + 1)} 
                    onRowsPerPageChange={() => {}}
                />
            </TableContainer>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {posts.map((post) => (
                        <Paper key={post.id} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Typography variant="caption" color="text.secondary">
                                    {format(new Date(post.createdAt), 'yyyy-MM-dd HH:mm')}
                                </Typography>
                                {getStatusChip(post.status)}
                            </Box>
                            
                            <Typography variant="body1" sx={{ my: 1 }}>
                                {post.content || <Typography component="span" fontStyle="italic" color="text.secondary">{t('common.noContent')}</Typography>}
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2, color: 'text.secondary', fontSize: '0.875rem', alignItems: 'center' }}>
                                {post.mediaType !== MediaType.NONE && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {post.mediaType === MediaType.IMAGE ? <ImageIcon size={16} /> : <Video size={16} />}
                                        <Typography variant="caption">{t(`socialPosts.tooltips.${post.mediaType === MediaType.IMAGE ? 'image' : 'video'}`)}</Typography>
                                    </Box>
                                )}
                                {post.scheduledFor && (
                                    <Box>
                                        <Typography variant="caption" fontWeight="bold">Scheduled: </Typography>
                                        <Typography variant="caption">{format(new Date(post.scheduledFor), 'MM-dd HH:mm')}</Typography>
                                    </Box>
                                )}
                            </Box>
                            
                            {(post.status === PostStatus.DRAFT || post.status === PostStatus.FAILED || post.status === PostStatus.SCHEDULED) && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => navigate(`/dashboard/social-posts/${post.id}`)}
                                        startIcon={<Edit size={16} />}
                                    >
                                        {t('common.edit')}
                                    </Button>
                                    {(post.status === PostStatus.DRAFT || post.status === PostStatus.FAILED) && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => handlePublishNow(post.id)}
                                            startIcon={<Send size={16} />}
                                        >
                                            {t('socialPosts.tooltips.publishNow')}
                                        </Button>
                                    )}
                                </Box>
                            )}
                        </Paper>
                    ))}
                    {posts.length === 0 && !loading && (
                        <Typography align="center" color="text.secondary" py={3}>
                            {t('socialPosts.table.noPosts')}
                        </Typography>
                    )}
                    <TablePagination
                        rowsPerPageOptions={[10, 20]}
                        component="div"
                        count={totalPages * limit}
                        rowsPerPage={limit}
                        page={page - 1}
                        onPageChange={(_, p) => setPage(p + 1)} 
                        onRowsPerPageChange={() => {}}
                    />
                </Box>
            )}
        </Box>
    );
};

export default SocialPostList;
