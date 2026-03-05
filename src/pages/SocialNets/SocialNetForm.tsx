import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  CircularProgress,
  Typography
} from '@mui/material';
import { Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { socialNetService } from '../../services/social-net.service';
import { toast } from 'react-hot-toast';
import BackButton from '../../components/common/BackButton';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  profileName: z.string().min(1, 'Profile Name is required').max(150),
  src: z.string().max(250).optional(),
  config: z.string().optional().refine((val) => {
    if (!val) return true;
    try {
      JSON.parse(val);
      return true;
    } catch (e) {
        return false;
    }
  }, 'Must be valid JSON'),
  active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const SocialNetForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      profileName: '',
      src: '',
      config: '',
      active: true,
    },
  });

  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      socialNetService.getOne(id)
        .then((data) => {
          reset({
            title: data.title,
            profileName: data.profileName,
            src: data.src || '',
            config: data.config || '',
            active: data.active,
          });
        })
        .catch(() => {
          toast.error('Error loading social net');
          navigate('/dashboard/social-nets');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditMode, navigate, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (isEditMode && id) {
        await socialNetService.update(id, data);
        toast.success(t('common.updateSuccess'));
      } else {
        await socialNetService.create(data);
        toast.success(t('common.createSuccess'));
      }
      navigate('/dashboard/social-nets');
    } catch (error) {
      toast.error(t('common.messages.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth="md" mx="auto">
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 2 }}>
        <BackButton />
        <Typography variant="h4">
          {isEditMode ? t('socialNets.edit') : t('socialNets.add')}
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t('socialNets.form.title')}
                fullWidth
                error={!!errors.title}
                helperText={errors.title?.message}
              />
            )}
          />

          <Controller
            name="profileName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t('socialNets.form.profileName')}
                fullWidth
                error={!!errors.profileName}
                helperText={errors.profileName?.message}
              />
            )}
          />

          <Controller
            name="src"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t('socialNets.form.src')}
                fullWidth
                error={!!errors.src}
                helperText={errors.src?.message}
              />
            )}
          />

          <Controller
            name="config"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t('socialNets.form.config')}
                fullWidth
                multiline
                rows={4}
                error={!!errors.config}
                helperText={errors.config?.message || 'Enter valid JSON configuration'}
                sx={{ fontFamily: 'monospace' }}
              />
            )}
          />

          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} />}
                label={field.value ? t('common.active') : t('common.inactive')}
              />
            )}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              {t('common.cancel')}
            </Button>
            <Button 
                type="submit" 
                variant="contained" 
                startIcon={<Save />}
                disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : t('common.save')}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default SocialNetForm;
