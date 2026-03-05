import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Divider,
  Paper,
} from '@mui/material';
import { Save, Plus, Trash2, GripVertical, ExternalLink, Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { webMngmtService } from '../../../services/web-mngmt.service';
import type { HeroContent, HeroButton, AllTranslations } from '../../../services/web-mngmt.service';

interface HeroFormProps {
  content: HeroContent;
  translations: AllTranslations;
  language: 'es' | 'en';
  onContentUpdate: (data: HeroContent) => void;
  onTranslationsUpdate: (lang: 'es' | 'en', data: Record<string, unknown>) => void;
}

const HeroForm: React.FC<HeroFormProps> = ({
  content,
  translations,
  language,
  onContentUpdate,
  onTranslationsUpdate,
}) => {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Local state for form
  const [heroContent, setHeroContent] = useState<HeroContent>(content);
  const [localTranslations, setLocalTranslations] = useState<AllTranslations>(translations);

  // Get translation value from nested path (e.g., 'home.title')
  const getTranslation = (lang: 'es' | 'en', path: string): string => {
    const keys = path.split('.');
    let value: unknown = localTranslations[lang];
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[key];
      } else {
        return '';
      }
    }
    return typeof value === 'string' ? value : '';
  };

  // Set translation value at nested path
  const setTranslation = (lang: 'es' | 'en', path: string, value: string) => {
    const keys = path.split('.');
    const newLangData = JSON.parse(JSON.stringify(localTranslations[lang]));

    let current = newLangData;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    setLocalTranslations({ ...localTranslations, [lang]: newLangData });
  };

  const handleAddButton = () => {
    const newButton: HeroButton = {
      key: `button_${Date.now()}`,
      href: '/',
      variant: 'primary',
    };
    setHeroContent({ ...heroContent, buttons: [...heroContent.buttons, newButton] });

    // Initialize translations for the new button
    const esData = JSON.parse(JSON.stringify(localTranslations.es));
    const enData = JSON.parse(JSON.stringify(localTranslations.en));
    if (!esData.home) esData.home = {};
    if (!enData.home) enData.home = {};
    if (!esData.home.buttons) esData.home.buttons = {};
    if (!enData.home.buttons) enData.home.buttons = {};
    esData.home.buttons[newButton.key] = 'Nuevo Botón';
    enData.home.buttons[newButton.key] = 'New Button';
    setLocalTranslations({ es: esData, en: enData });
  };

  const handleRemoveButton = (index: number) => {
    const buttonKey = heroContent.buttons[index].key;
    const newButtons = heroContent.buttons.filter((_, i) => i !== index);
    setHeroContent({ ...heroContent, buttons: newButtons });

    // Remove button translations
    const esData = JSON.parse(JSON.stringify(localTranslations.es));
    const enData = JSON.parse(JSON.stringify(localTranslations.en));
    if (esData.home?.buttons) delete esData.home.buttons[buttonKey];
    if (enData.home?.buttons) delete enData.home.buttons[buttonKey];
    setLocalTranslations({ es: esData, en: enData });
  };

  const handleButtonChange = (index: number, field: keyof HeroButton, value: string) => {
    const newButtons = [...heroContent.buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setHeroContent({ ...heroContent, buttons: newButtons });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save content
      await webMngmtService.updateContentBySection('hero', heroContent);

      // Save translations for both languages
      await Promise.all([
        webMngmtService.updateTranslationByLanguage('es', localTranslations.es),
        webMngmtService.updateTranslationByLanguage('en', localTranslations.en),
      ]);

      onContentUpdate(heroContent);
      onTranslationsUpdate('es', localTranslations.es);
      onTranslationsUpdate('en', localTranslations.en);

      toast.success(t('common.updateSuccess'));
    } catch (error) {
      toast.error(t('common.updateError'));
      console.error('Error saving hero content:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const websiteUrl = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:3001';
    window.open(websiteUrl, '_blank');
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error(t('webContent.hero.invalidVideoType'));
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t('webContent.hero.videoTooLarge'));
      return;
    }

    setUploadingVideo(true);
    try {
      const response = await webMngmtService.uploadHeroVideo(file);
      setHeroContent({ ...heroContent, videoUrl: response.url });
      toast.success(t('webContent.hero.videoUploaded'));
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error(t('webContent.hero.videoUploadError'));
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const handleVideoRemove = async () => {
    try {
      await webMngmtService.deleteHeroVideo();
      setHeroContent({ ...heroContent, videoUrl: null });
      toast.success(t('webContent.hero.videoRemoved'));
    } catch (error) {
      console.error('Error removing video:', error);
      toast.error(t('webContent.hero.videoRemoveError'));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('webContent.hero.invalidImageType'));
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t('webContent.hero.imageTooLarge'));
      return;
    }

    setUploadingImage(true);
    try {
      const response = await webMngmtService.uploadHeroImage(file);
      setHeroContent({ ...heroContent, heroImage: response.url });
      toast.success(t('webContent.hero.imageUploaded'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('webContent.hero.imageUploadError'));
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleImageRemove = async () => {
    try {
      await webMngmtService.deleteHeroImage();
      setHeroContent({ ...heroContent, heroImage: '' });
      toast.success(t('webContent.hero.imageRemoved'));
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error(t('webContent.hero.imageRemoveError'));
    }
  };

  const getVideoUrl = () => {
    if (!heroContent.videoUrl) return null;
    if (heroContent.videoUrl.startsWith('http')) return heroContent.videoUrl;
    const assetsUrl = import.meta.env.VITE_ASSETS_URL || 'http://localhost:3000/assets';
    return `${assetsUrl}/${heroContent.videoUrl}`;
  };

  const getImageUrl = () => {
    if (!heroContent.heroImage) return null;
    if (heroContent.heroImage.startsWith('http')) return heroContent.heroImage;
    const assetsUrl = import.meta.env.VITE_ASSETS_URL || 'http://localhost:3000/assets';
    return `${assetsUrl}/${heroContent.heroImage}`;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" fontWeight="bold">
        {t('webContent.hero.title')}
      </Typography>

      {/* Translatable fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {t('webContent.translatableContent')} ({language.toUpperCase()})
        </Typography>

        <TextField
          label={t('webContent.hero.mainTitle')}
          value={getTranslation(language, 'home.title')}
          onChange={(e) => setTranslation(language, 'home.title', e.target.value)}
          fullWidth
        />

        <TextField
          label={t('webContent.hero.subtitle')}
          value={getTranslation(language, 'home.subtitle')}
          onChange={(e) => setTranslation(language, 'home.subtitle', e.target.value)}
          fullWidth
          multiline
          rows={2}
        />
      </Box>

      <Divider />

      {/* Non-translatable fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {t('webContent.mediaContent')}
        </Typography>

        {/* Video Upload */}
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {t('webContent.hero.video')}
          </Typography>

          {heroContent.videoUrl ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 400,
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <video
                  src={getVideoUrl() || undefined}
                  controls
                  style={{ width: '100%', height: 'auto', maxHeight: 225 }}
                />
                <IconButton
                  onClick={handleVideoRemove}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'error.dark' },
                  }}
                  size="small"
                >
                  <X size={16} />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {heroContent.videoUrl}
              </Typography>
            </Box>
          ) : (
            <Box>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                style={{ display: 'none' }}
                id="hero-video-upload"
              />
              <label htmlFor="hero-video-upload">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={uploadingVideo ? <CircularProgress size={18} /> : <Upload size={18} />}
                  disabled={uploadingVideo}
                >
                  {uploadingVideo ? t('common.loading') : t('webContent.hero.uploadVideo')}
                </Button>
              </label>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {t('webContent.hero.videoHint')}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Hero Image Upload */}
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {t('webContent.hero.heroImage')}
          </Typography>

          {heroContent.heroImage ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 400,
                  borderRadius: 1,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <img
                  src={getImageUrl() || undefined}
                  alt="Hero"
                  style={{ width: '100%', height: 'auto', maxHeight: 300, objectFit: 'cover' }}
                />
                <IconButton
                  onClick={handleImageRemove}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'error.dark' },
                  }}
                  size="small"
                >
                  <X size={16} />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {heroContent.heroImage}
              </Typography>
            </Box>
          ) : (
            <Box>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="hero-image-upload"
              />
              <label htmlFor="hero-image-upload">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={uploadingImage ? <CircularProgress size={18} /> : <Upload size={18} />}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? t('common.loading') : t('webContent.hero.uploadImage')}
                </Button>
              </label>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {t('webContent.hero.imageHint')}
              </Typography>
            </Box>
          )}
        </Box>

        <TextField
          label={t('webContent.hero.backgroundImage')}
          value={heroContent.backgroundImage}
          onChange={(e) => setHeroContent({ ...heroContent, backgroundImage: e.target.value })}
          fullWidth
          placeholder="/images/..."
        />
      </Box>

      <Divider />

      {/* Buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('webContent.hero.buttons')}
          </Typography>
          <Button startIcon={<Plus size={18} />} size="small" onClick={handleAddButton}>
            {t('webContent.hero.addButton')}
          </Button>
        </Box>

        {heroContent.buttons.map((button, index) => (
          <Paper key={button.key} variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <GripVertical size={20} style={{ marginTop: 16, cursor: 'grab', color: '#999' }} />

              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label={t('webContent.hero.buttonText')}
                  value={getTranslation(language, `home.buttons.${button.key}`)}
                  onChange={(e) => setTranslation(language, `home.buttons.${button.key}`, e.target.value)}
                  fullWidth
                  size="small"
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label={t('webContent.hero.buttonUrl')}
                    value={button.href}
                    onChange={(e) => handleButtonChange(index, 'href', e.target.value)}
                    fullWidth
                    size="small"
                  />

                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>{t('webContent.hero.buttonVariant')}</InputLabel>
                    <Select
                      value={button.variant}
                      label={t('webContent.hero.buttonVariant')}
                      onChange={(e) => handleButtonChange(index, 'variant', e.target.value as 'primary' | 'outline')}
                    >
                      <MenuItem value="primary">{t('webContent.hero.variants.primary')}</MenuItem>
                      <MenuItem value="outline">{t('webContent.hero.variants.outline')}</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <IconButton
                color="error"
                onClick={() => handleRemoveButton(index)}
                sx={{ mt: 1 }}
              >
                <Trash2 size={18} />
              </IconButton>
            </Box>
          </Paper>
        ))}
      </Box>

      <Divider />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ExternalLink size={18} />}
          onClick={handlePreview}
        >
          {t('webContent.preview')}
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </Box>
    </Box>
  );
};

export default HeroForm;
