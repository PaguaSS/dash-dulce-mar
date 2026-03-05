
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  IconButton,
  Checkbox,
  FormGroup,
  Divider
} from '@mui/material';
import { Save, CloudUpload, Delete } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { socialPostService } from '../../services/social-post.service';
import { socialNetService } from '../../services/social-net.service';
import { toast } from 'react-hot-toast';
import { DesktopDateTimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useTranslation } from 'react-i18next';
import BackButton from '../../components/common/BackButton';
import { compressImage } from '../../utils/imageCompression';
import { ScheduleType, PostStatus } from '../../types/social-post.types';

const SocialPostForm: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const schema = useMemo(() => z.object({
        content: z.string().optional(),
        media: z.instanceof(File).optional().nullable(),
        scheduleType: z.enum([ScheduleType.DRAFT, ScheduleType.NOW, ScheduleType.SCHEDULE]),
        scheduledFor: z.date().nullable().optional(),
        networkIds: z.array(z.string()).min(1, t('socialPosts.messages.selectNetwork') || 'At least one network must be selected'),
    }).refine((data) => {
        if (data.scheduleType === ScheduleType.SCHEDULE && !data.scheduledFor) return false;
        return true;
    }, {
        message: t('socialPosts.messages.scheduled') || 'Schedule type requires a date', 
        path: ["scheduledFor"]
    }).refine(data => data.content || data.media || (isEditMode && previewUrl), { 
        // Allow if editing and has existing media (previewUrl)
        message: t('socialPosts.messages.mustProvideContent') || 'Must provide content or media',
        path: ["content"]
    }), [t, isEditMode, previewUrl]);

    type FormData = z.infer<typeof schema>;

    const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            content: '',
            media: null,
            scheduleType: ScheduleType.DRAFT,
            scheduledFor: null,
            networkIds: [],
        },
    });

    const [socialNets, setSocialNets] = useState<any[]>([]);

    useEffect(() => {
        socialNetService.getAll()
            .then(res => setSocialNets(res.data.filter((n: any) => n.active)))
            .catch(err => console.error("Error fetching social nets", err));
    }, []);

    const watchedScheduleType = watch('scheduleType');
    const watchedMedia = watch('media');

    // Load data for edit
    useEffect(() => {
        if (isEditMode && id) {
            setLoading(true);
            socialPostService.getOne(id)
                .then((post) => {
                    const queryScheduleType = post.status === PostStatus.SCHEDULED ? ScheduleType.SCHEDULE : ScheduleType.DRAFT;
                    reset({
                        content: post.content || '',
                        scheduleType: queryScheduleType,
                        scheduledFor: post.scheduledFor ? new Date(post.scheduledFor) : null,
                        networkIds: post.networkIds || [],
                        media: null // File input can't be set programmatically
                    });
                    
                    if (post.mediaUrl) {
                        setPreviewUrl(post.mediaUrl.startsWith('http') ? post.mediaUrl : `${import.meta.env.VITE_ASSETS_URL || 'http://localhost:3000/assets'}/${post.mediaUrl}`);
                    }
                })
                .catch(() => {
                    toast.error(t('socialPosts.messages.loadFailed'));
                    navigate('/dashboard/social-posts');
                })
                .finally(() => setLoading(false));
        }
    }, [isEditMode, id, navigate, reset]);

    // Handle preview generation for new files
    useEffect(() => {
        if (watchedMedia) {
            const url = URL.createObjectURL(watchedMedia);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [watchedMedia]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                // Compress image
                const compressed = await compressImage(file);
                setValue('media', compressed, { shouldValidate: true });
            } catch (error) {
                console.error("Compression failed", error);
                // Fallback to original
                setValue('media', file, { shouldValidate: true });
            }
        }
    };

    const handleRemoveFile = () => {
        setValue('media', null, { shouldValidate: true });
        setPreviewUrl(null); // Clear preview (whether new or existing)
    };

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            const payload = {
                ...data,
                scheduledFor: data.scheduledFor ? data.scheduledFor.toISOString() : undefined,
                media: data.media
            };
            
            if (isEditMode && id) {
                 await socialPostService.update(id, payload);
                 toast.success(t('common.updateSuccess'));
            } else {
                 await socialPostService.create(payload);
                 toast.success(t('socialPosts.messages.draftCreated')); // Or createSuccess
            }
            
            navigate('/dashboard/social-posts');
        } catch (error) {
            toast.error(isEditMode ? t('common.updateError') : t('socialPosts.messages.createError'));
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode && !previewUrl) { // Show loader only on initial fetch
         return (
             <Box p={4} textAlign="center"><Typography>{t('common.loading')}</Typography></Box>
         );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box maxWidth="md" mx="auto">
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2 }}>
                <BackButton />
                <Typography variant="h4">{isEditMode ? t('socialPosts.edit') : t('socialPosts.new')}</Typography>
            </Box>

            <Paper sx={{ p: 4 }}>
                <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* Content Input */}
                <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                    <TextField
                        {...field}
                        label={t('socialPosts.form.content')}
                        multiline
                        rows={4}
                        fullWidth
                        error={!!errors.content}
                        helperText={errors.content?.message}
                        placeholder={t('socialPosts.form.contentPlaceholder')}
                    />
                    )}
                />

                {/* File Upload & Preview */}
                <Box>
                    <Typography variant="subtitle2" gutterBottom>{t('socialPosts.form.mediaType')}</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={2}>
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<CloudUpload />}
                        >
                            {t('socialPosts.form.uploadMedia')}
                            <input
                                type="file"
                                hidden
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                            />
                        </Button>
                        {(watchedMedia || previewUrl) && (
                            <IconButton onClick={handleRemoveFile} color="error" title={t('socialPosts.form.removeMedia')}>
                                <Delete />
                            </IconButton>
                        )}
                    </Stack>
                    {errors.media && (
                         <Typography color="error" variant="caption">{errors.media.message}</Typography>
                    )}

                    {previewUrl && (
                        <Box mt={2} sx={{ maxWidth: '100%', maxHeight: 300, overflow: 'hidden', borderRadius: 1, border: '1px solid #ddd' }}>
                             {/* Simple check based on file type or url extension/context. 
                                 For existing URL, we might not know if video/image easily unless stored.
                                 Assuming image mostly for now or checking extension. 
                              */}
                            <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }} />
                        </Box>
                    )}
                </Box>

                {/* Schedule Type Radio Group */}
                <Controller
                    name="scheduleType"
                    control={control}
                    render={({ field }) => (
                        <FormControl component="fieldset">
                            <FormLabel component="legend">{t('socialPosts.form.scheduleType')}</FormLabel>
                            <RadioGroup row {...field}>
                                <FormControlLabel value={ScheduleType.DRAFT} control={<Radio />} label={t('socialPosts.form.scheduleTypes.draft')} />
                                <FormControlLabel value={ScheduleType.NOW} control={<Radio />} label={t('socialPosts.form.scheduleTypes.now')} />
                                <FormControlLabel value={ScheduleType.SCHEDULE} control={<Radio />} label={t('socialPosts.form.scheduleTypes.schedule')} />
                            </RadioGroup>
                        </FormControl>
                    )}
                />

                {/* Date Picker - Conditional */}
                {watchedScheduleType === ScheduleType.SCHEDULE && (
                    <Controller
                        name="scheduledFor"
                        control={control}
                        render={({ field }) => (
                        <DesktopDateTimePicker 
                                label={t('socialPosts.form.schedule')}
                                value={field.value}
                                onChange={(date) => field.onChange(date)}
                                slotProps={{ 
                                    textField: { 
                                        fullWidth: true,
                                        error: !!errors.scheduledFor,
                                        helperText: errors.scheduledFor?.message
                                    } 
                                }}
                        />
                        )}
                    />
                )}

                <Divider />

                {/* Social Networks Selection */}
                <Box>
                    <Typography variant="subtitle1" gutterBottom>{t('socialPosts.form.selectNetworks') || 'Select Networks'}</Typography>
                    <Controller
                        name="networkIds"
                        control={control}
                        render={({ field }) => (
                            <FormGroup row>
                                {socialNets.map((net) => (
                                    <FormControlLabel
                                        key={net.id}
                                        control={
                                            <Checkbox
                                                checked={field.value?.includes(net.id)}
                                                onChange={(e) => {
                                                    const newValue = e.target.checked
                                                        ? [...(field.value || []), net.id]
                                                        : (field.value || []).filter((val: string) => val !== net.id);
                                                    field.onChange(newValue);
                                                }}
                                            />
                                        }
                                        label={net.title}
                                    />
                                ))}
                            </FormGroup>
                        )}
                    />
                    {errors.networkIds && (
                        <Typography color="error" variant="caption">{errors.networkIds.message}</Typography>
                    )}
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                    <BackButton variant="outlined">{t('common.cancel')}</BackButton>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        startIcon={<Save />}
                        disabled={loading}
                    >
                    {loading ? t('socialPosts.form.saving') : t('socialPosts.form.save')}
                    </Button>
                </Box>
                </Box>
            </Paper>
        </Box>
        </LocalizationProvider>
    );
};

export default SocialPostForm;
