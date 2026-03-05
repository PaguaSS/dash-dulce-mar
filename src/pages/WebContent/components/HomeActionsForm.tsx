import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Save, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { webMngmtService } from '../../../services/web-mngmt.service';
import type { AllTranslations } from '../../../services/web-mngmt.service';

interface HomeActionsFormProps {
  translations: AllTranslations;
  language: 'es' | 'en';
  onTranslationsUpdate: (lang: 'es' | 'en', data: Record<string, unknown>) => void;
}

const HomeActionsForm: React.FC<HomeActionsFormProps> = ({
  translations,
  language,
  onTranslationsUpdate,
}) => {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        webMngmtService.updateTranslationByLanguage('es', localTranslations.es),
        webMngmtService.updateTranslationByLanguage('en', localTranslations.en),
      ]);

      onTranslationsUpdate('es', localTranslations.es);
      onTranslationsUpdate('en', localTranslations.en);

      toast.success(t('common.updateSuccess'));
    } catch (error) {
      toast.error(t('common.updateError'));
      console.error('Error saving home actions translations:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const websiteUrl = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:3001';
    window.open(websiteUrl, '_blank');
  };

  const renderSection = (titleKey: string, sectionPrefix: string, fields: { key: string; label: string; multiline?: boolean }[]) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
       <Typography variant="subtitle1" fontWeight="bold" color="primary">
        {t(titleKey)}
      </Typography>
      {fields.map((field) => (
        <TextField
          key={field.key}
          label={t(field.label)}
          value={getTranslation(language, `home.${sectionPrefix}.${field.key}`)}
          onChange={(e) => setTranslation(language, `home.${sectionPrefix}.${field.key}`, e.target.value)}
          fullWidth
          multiline={field.multiline}
          rows={field.multiline ? 3 : 1}
        />
      ))}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
                {t('webContent.tabs.home')}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
                ({language.toUpperCase()})
            </Typography>
        </Box>

      {/* Actions Header */}
      {renderSection('webContent.home.actions.title', 'actions', [
        { key: 'title', label: 'webContent.home.actions.title' },
        { key: 'subtitle', label: 'webContent.home.actions.subtitle' },
      ])}

      <Divider />

      {/* Social Section */}
      {renderSection('webContent.home.social.title', 'social', [
        { key: 'title', label: 'webContent.home.social.title' },
        { key: 'description', label: 'webContent.home.social.description', multiline: true },
      ])}

      <Divider />

      {/* Portfolio Section */}
      {renderSection('webContent.home.portfolio.title', 'portfolio', [
        { key: 'title', label: 'webContent.home.portfolio.title' },
        { key: 'description', label: 'webContent.home.portfolio.description', multiline: true },
        { key: 'cta', label: 'webContent.home.portfolio.cta' },
      ])}

       <Divider />

      {/* Calculator Section */}
      {renderSection('webContent.home.calculator.title', 'calculator', [
        { key: 'title', label: 'webContent.home.calculator.title' },
        { key: 'description', label: 'webContent.home.calculator.description', multiline: true },
        { key: 'cta', label: 'webContent.home.calculator.cta' },
      ])}


      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
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

export default HomeActionsForm;
