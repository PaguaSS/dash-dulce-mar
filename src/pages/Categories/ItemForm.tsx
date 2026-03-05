import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Save, Upload, X, Star } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { categoryService } from '../../services/category.service';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { compressImage } from '../../utils/imageCompression';
import BackButton from '../../components/common/BackButton';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(150),
  description: z.string().max(250).optional(),
  active: z.boolean(),
  isTop: z.boolean(),
  categoryId: z.uuid('Parent Category ID is required'),
});

type FormData = z.infer<typeof schema>;

const ItemForm: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditMode = !!id;

  const categoryIdFromUrl = searchParams.get('categoryId');

  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categoryTitle, setCategoryTitle] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      active: true,
      isTop: false,
      categoryId: categoryIdFromUrl || '',
    },
  });

  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      categoryService
        .getItem(id)
        .then((data) => {
          reset({
            title: data.title,
            description: data.description,
            active: data.active,
            isTop: data.isTop,
            categoryId: data.categoryId,
          });
          if (data.image) {
            setImagePreview(
              `${import.meta.env.VITE_ASSETS_URL || 'http://localhost:3000/assets'}/category-items/${data.image}`,
            );
          }
        })
        .catch(() => {
          toast.error(t('common.errorLoading'));
          navigate('/dashboard/portfolio');
        })
        .finally(() => setLoading(false));
    } else if (categoryIdFromUrl) {
      // Ensure default value is set if coming from URL
      reset((values) => ({ ...values, categoryId: categoryIdFromUrl }));

      // Fetch parent category for display title
      categoryService
        .getOne(categoryIdFromUrl)
        .then((cat) => setCategoryTitle(cat.title))
        .catch(console.error);
    }
  }, [id, isEditMode, navigate, reset, t, categoryIdFromUrl]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      try {
        setLoading(true);
        // Compress if larger than 1.5MB
        const compressedFile = await compressImage(file);

        setImageFile(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));
      } catch (error) {
        toast.error(t('common.messages.errorProcessingImage'));
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      formData.append('active', String(data.active));
      formData.append('isTop', String(data.isTop));
      formData.append('categoryId', data.categoryId);

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (isEditMode && id) {
        await categoryService.updateItem(id, formData);
        toast.success(t('common.updateSuccess'));
      } else {
        await categoryService.createItem(formData);
        toast.success(t('common.createSuccess'));
      }

      // Navigate back to the parent folder
      navigate(`/dashboard/portfolio?parentCategoryId=${data.categoryId}`);
    } catch (_error) {
      toast.error(
        isEditMode ? t('common.updateError') : t('common.createError'),
      );
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
          gap: 2,
        }}
      >
        <BackButton />
        <Typography variant="h4">
          {isEditMode ? t('portfolio.editItem') : t('portfolio.addItem')}
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* hidden field or display only for parent category context */}
            {categoryIdFromUrl && !isEditMode && (
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ mb: 2, display: 'block' }}
              >
                Adding item to Category: {categoryTitle || t('common.loading')}
              </Typography>
            )}
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('common.title')}
                  fullWidth
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('common.description')}
                  fullWidth
                  multiline
                  rows={3}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('common.image')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {imagePreview ? (
                  <Box sx={{ position: 'relative', width: 100, height: 100 }}>
                    <Box
                      component="img"
                      src={imagePreview}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={removeImage}
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        bgcolor: 'background.paper',
                        boxShadow: 1,
                      }}
                    >
                      <X size={14} />
                    </IconButton>
                  </Box>
                ) : (
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<Upload />}
                  >
                    {t('common.upload')}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                )}
              </Box>
            </Box>

            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch checked={field.value} onChange={field.onChange} />
                  }
                  label={
                    field.value ? t('common.active') : t('common.inactive')
                  }
                />
              )}
            />

            <Controller
              name="isTop"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch checked={field.value} onChange={field.onChange} />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Star
                        size={16}
                        fill={field.value ? 'currentColor' : 'none'}
                        color={field.value ? '#ed6c02' : 'currentColor'}
                      />
                      {field.value ? t('common.isTop') : t('common.notTop')}
                    </Box>
                  }
                />
              )}
            />

            <input type="hidden" {...control.register('categoryId')} />
            {errors.categoryId && (
              <Typography color="error" variant="caption">
                {errors.categoryId.message}
              </Typography>
            )}

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
                mt: 2,
              }}
            >
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
        </Box>
      </Paper>
    </Box>
  );
};

export default ItemForm;
