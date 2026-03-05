import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Save, Plus, Trash2, GripVertical, ExternalLink, Upload, X, AlignLeft, AlignRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { webMngmtService } from '../../../services/web-mngmt.service';
import RichTextEditor from '../../../components/RichTextEditor';
import type { AboutUsSection, AllTranslations } from '../../../services/web-mngmt.service';

interface AboutUsFormProps {
  content: AboutUsSection[];
  translations: AllTranslations;
  language: 'es' | 'en';
  onContentUpdate: (data: AboutUsSection[]) => void;
  onTranslationsUpdate: (lang: 'es' | 'en', data: Record<string, unknown>) => void;
}

const AboutUsForm: React.FC<AboutUsFormProps> = ({
  content,
  translations,
  language,
  onContentUpdate,
  onTranslationsUpdate,
}) => {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  // Local state for form
  const [sections, setSections] = useState<AboutUsSection[]>(content || []);
  const [localTranslations, setLocalTranslations] = useState<AllTranslations>(translations);

  // Get translation value from nested path
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

  const handleAddSection = () => {
    const newId = `section_${Date.now()}`;
    const newSection: AboutUsSection = {
      id: newId,
      anchor: '',
      imageUrl: null,
      imageAlignment: 'left',
    };
    setSections([...sections, newSection]);

    // Initialize translations
    const esData = JSON.parse(JSON.stringify(localTranslations.es));
    const enData = JSON.parse(JSON.stringify(localTranslations.en));
    if (!esData.about) esData.about = {};
    if (!enData.about) enData.about = {};
    if (!esData.about.sections) esData.about.sections = {};
    if (!enData.about.sections) enData.about.sections = {};
    esData.about.sections[newId] = { title: 'Nueva Sección', content: '' };
    enData.about.sections[newId] = { title: 'New Section', content: '' };
    setLocalTranslations({ es: esData, en: enData });
  };

  const handleRemoveSection = (index: number) => {
    const sectionId = sections[index].id;
    const newSections = sections.filter((_, i) => i !== index);
    setSections(newSections);

    // Remove translations
    const esData = JSON.parse(JSON.stringify(localTranslations.es));
    const enData = JSON.parse(JSON.stringify(localTranslations.en));
    if (esData.about?.sections) delete esData.about.sections[sectionId];
    if (enData.about?.sections) delete enData.about.sections[sectionId];
    setLocalTranslations({ es: esData, en: enData });
  };

  const handleSectionChange = (index: number, field: keyof AboutUsSection, value: any) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], [field]: value };
    setSections(newSections);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await webMngmtService.updateContentBySection('aboutUs', sections);
      await Promise.all([
        webMngmtService.updateTranslationByLanguage('es', localTranslations.es),
        webMngmtService.updateTranslationByLanguage('en', localTranslations.en),
      ]);

      onContentUpdate(sections);
      onTranslationsUpdate('es', localTranslations.es);
      onTranslationsUpdate('en', localTranslations.en);

      toast.success(t('common.updateSuccess'));
    } catch (error) {
      toast.error(t('common.updateError'));
      console.error('Error saving about content:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('webContent.hero.invalidImageType'));
      return;
    }

    const sectionId = sections[index].id;
    setUploadingImage(sectionId);
    try {
      const response = await webMngmtService.uploadGenericImage(file);
      handleSectionChange(index, 'imageUrl', response.url);
      toast.success(t('webContent.hero.imageUploaded'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('webContent.hero.imageUploadError'));
    } finally {
      setUploadingImage(null);
    }
  };

  const getFullImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const assetsUrl = import.meta.env.VITE_ASSETS_URL || 'http://localhost:3000/assets';
    return `${assetsUrl}/${url}`;
  };

  const handlePreview = () => {
    const websiteUrl = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:3001';
    window.open(`${websiteUrl}/nosotros`, '_blank');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">
          {t('webContent.tabs.about')}
        </Typography>
        <Button startIcon={<Plus size={18} />} variant="contained" onClick={handleAddSection} size="small">
          {t('webContent.about.addSection')}
        </Button>
      </Box>

      {sections.map((section, index) => (
        <Paper key={section.id} variant="outlined" sx={{ p: 3, position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
            <IconButton color="error" onClick={() => handleRemoveSection(index)} size="small">
              <Trash2 size={18} />
            </IconButton>
          </Box>

          <Stack spacing={3}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <GripVertical size={20} style={{ cursor: 'grab', color: '#999' }} />
              <Typography variant="subtitle1" fontWeight="bold">
                {t('webContent.about.section')} {index + 1}
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Image Section */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('webContent.mediaContent')}</Typography>
                {section.imageUrl ? (
                  <Box sx={{ position: 'relative', width: '100%', height: 200, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                    <img src={getFullImageUrl(section.imageUrl)!} alt="Section" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <IconButton
                      onClick={() => handleSectionChange(index, 'imageUrl', null)}
                      sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                      size="small"
                    >
                      <X size={16} />
                    </IconButton>
                  </Box>
                ) : (
                  <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 3, textAlign: 'center' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(index, e)}
                      style={{ display: 'none' }}
                      id={`upload-${section.id}`}
                    />
                    <label htmlFor={`upload-${section.id}`}>
                      <Button
                        component="span"
                        variant="outlined"
                        startIcon={uploadingImage === section.id ? <CircularProgress size={18} /> : <Upload size={18} />}
                        disabled={uploadingImage !== null}
                      >
                        {uploadingImage === section.id ? t('common.loading') : t('webContent.hero.uploadImage')}
                      </Button>
                    </label>
                  </Box>
                )}

                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    {t('webContent.about.alignment')}
                  </Typography>
                  <ToggleButtonGroup
                    value={section.imageAlignment}
                    exclusive
                    onChange={(_, val) => val && handleSectionChange(index, 'imageAlignment', val)}
                    size="small"
                  >
                    <ToggleButton value="left">
                      <AlignLeft size={18} style={{ marginRight: 8 }} /> {t('webContent.about.left')}
                    </ToggleButton>
                    <ToggleButton value="right">
                      {t('webContent.about.right')} <AlignRight size={18} style={{ marginLeft: 8 }} />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Box>

              {/* Text Section */}
              <Stack spacing={2}>
                <Typography variant="subtitle2">{t('webContent.translatableContent')} ({language.toUpperCase()})</Typography>
                <TextField
                  label={t('webContent.about.sectionTitle')}
                  value={getTranslation(language, `about.sections.${section.id}.title`)}
                  onChange={(e) => setTranslation(language, `about.sections.${section.id}.title`, e.target.value)}
                  fullWidth
                  size="small"
                />
                <RichTextEditor
                  label={t('webContent.about.sectionContent')}
                  value={getTranslation(language, `about.sections.${section.id}.content`)}
                  onChange={(html) => setTranslation(language, `about.sections.${section.id}.content`, html)}
                />
                <TextField
                  label={t('webContent.about.anchor')}
                  value={section.anchor}
                  onChange={(e) => handleSectionChange(index, 'anchor', e.target.value)}
                  fullWidth
                  placeholder="ej: nuestra-historia"
                  size="small"
                  helperText={t('webContent.about.anchorHint')}
                />
              </Stack>
            </Box>
          </Stack>
        </Paper>
      ))}

      {sections.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider' }}>
          <Typography color="text.secondary">{t('webContent.about.noSections')}</Typography>
        </Paper>
      )}

      <Divider />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" startIcon={<ExternalLink size={18} />} onClick={handlePreview}>
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

export default AboutUsForm;
