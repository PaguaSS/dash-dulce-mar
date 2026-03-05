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
} from '@mui/material';
import { Save, Plus, Trash2, GripVertical, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { webMngmtService } from '../../../services/web-mngmt.service';
import type { TopCakesContent, CakeItem, AllTranslations } from '../../../services/web-mngmt.service';

interface TopCakesFormProps {
  content: TopCakesContent;
  translations: AllTranslations;
  language: 'es' | 'en';
  onContentUpdate: (data: TopCakesContent) => void;
  onTranslationsUpdate: (lang: 'es' | 'en', data: Record<string, unknown>) => void;
}

const TopCakesForm: React.FC<TopCakesFormProps> = ({
  content,
  translations,
  language,
  onContentUpdate,
  onTranslationsUpdate,
}) => {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const [cakesContent, setCakesContent] = useState<TopCakesContent>(content);
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

  const handleAddCake = () => {
    const newCakeId = `cake_${Date.now()}`;
    const newCake: CakeItem = {
      id: newCakeId,
      imageUrl: '',
    };
    setCakesContent({ ...cakesContent, cakes: [...cakesContent.cakes, newCake] });

    // Initialize translations for the new cake
    const esData = JSON.parse(JSON.stringify(localTranslations.es));
    const enData = JSON.parse(JSON.stringify(localTranslations.en));
    if (!esData.topCakes) esData.topCakes = { cakes: {} };
    if (!esData.topCakes.cakes) esData.topCakes.cakes = {};
    if (!enData.topCakes) enData.topCakes = { cakes: {} };
    if (!enData.topCakes.cakes) enData.topCakes.cakes = {};

    esData.topCakes.cakes[newCakeId] = { name: 'Nuevo Pastel', price: '₡0' };
    enData.topCakes.cakes[newCakeId] = { name: 'New Cake', price: '₡0' };
    setLocalTranslations({ es: esData, en: enData });
  };

  const handleRemoveCake = (index: number) => {
    const cakeId = cakesContent.cakes[index].id;
    const newCakes = cakesContent.cakes.filter((_, i) => i !== index);
    setCakesContent({ ...cakesContent, cakes: newCakes });

    // Remove cake translations
    const esData = JSON.parse(JSON.stringify(localTranslations.es));
    const enData = JSON.parse(JSON.stringify(localTranslations.en));
    if (esData.topCakes?.cakes) delete esData.topCakes.cakes[cakeId];
    if (enData.topCakes?.cakes) delete enData.topCakes.cakes[cakeId];
    setLocalTranslations({ es: esData, en: enData });
  };

  const handleCakeImageChange = (index: number, imageUrl: string) => {
    const newCakes = [...cakesContent.cakes];
    newCakes[index] = { ...newCakes[index], imageUrl };
    setCakesContent({ ...cakesContent, cakes: newCakes });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await webMngmtService.updateContentBySection('topCakes', cakesContent);

      await Promise.all([
        webMngmtService.updateTranslationByLanguage('es', localTranslations.es),
        webMngmtService.updateTranslationByLanguage('en', localTranslations.en),
      ]);

      onContentUpdate(cakesContent);
      onTranslationsUpdate('es', localTranslations.es);
      onTranslationsUpdate('en', localTranslations.en);

      toast.success(t('common.updateSuccess'));
    } catch (error) {
      toast.error(t('common.updateError'));
      console.error('Error saving top cakes content:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const websiteUrl = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:3001';
    window.open(websiteUrl, '_blank');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h6" fontWeight="bold">
        {t('webContent.topCakes.title')}
      </Typography>

      {/* Section header translations */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {t('webContent.translatableContent')} ({language.toUpperCase()})
        </Typography>

        <TextField
          label={t('webContent.topCakes.badge')}
          value={getTranslation(language, 'topCakes.badge')}
          onChange={(e) => setTranslation(language, 'topCakes.badge', e.target.value)}
          fullWidth
        />

        <TextField
          label={t('webContent.topCakes.sectionTitle')}
          value={getTranslation(language, 'topCakes.title')}
          onChange={(e) => setTranslation(language, 'topCakes.title', e.target.value)}
          fullWidth
        />

        <TextField
          label={t('webContent.topCakes.sectionSubtitle')}
          value={getTranslation(language, 'topCakes.subtitle')}
          onChange={(e) => setTranslation(language, 'topCakes.subtitle', e.target.value)}
          fullWidth
          multiline
          rows={2}
        />
      </Box>

      <Divider />

      {/* Cakes list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('webContent.topCakes.cakesList')}
          </Typography>
          <Button startIcon={<Plus size={18} />} size="small" onClick={handleAddCake}>
            {t('webContent.topCakes.addCake')}
          </Button>
        </Box>

        {cakesContent.cakes.map((cake, index) => (
          <Paper key={cake.id} variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <GripVertical size={20} style={{ marginTop: 16, cursor: 'grab', color: '#999' }} />

              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label={t('webContent.topCakes.cakeName')}
                    value={getTranslation(language, `topCakes.cakes.${cake.id}.name`)}
                    onChange={(e) => setTranslation(language, `topCakes.cakes.${cake.id}.name`, e.target.value)}
                    fullWidth
                    size="small"
                  />

                  <TextField
                    label={t('webContent.topCakes.cakePrice')}
                    value={getTranslation(language, `topCakes.cakes.${cake.id}.price`)}
                    onChange={(e) => setTranslation(language, `topCakes.cakes.${cake.id}.price`, e.target.value)}
                    sx={{ width: 150 }}
                    size="small"
                  />
                </Box>

                <TextField
                  label={t('webContent.topCakes.cakeImage')}
                  value={cake.imageUrl}
                  onChange={(e) => handleCakeImageChange(index, e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="https://..."
                />
              </Box>

              <IconButton
                color="error"
                onClick={() => handleRemoveCake(index)}
                sx={{ mt: 1 }}
              >
                <Trash2 size={18} />
              </IconButton>
            </Box>
          </Paper>
        ))}

        {cakesContent.cakes.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            {t('webContent.topCakes.noCakes')}
          </Typography>
        )}
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

export default TopCakesForm;
