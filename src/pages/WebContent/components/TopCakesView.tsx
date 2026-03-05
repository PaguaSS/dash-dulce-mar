import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Button,
  TextField,
  Divider,
} from '@mui/material';
import { ExternalLink, Star, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { categoryService as portfolioService } from '../../../services/category.service';
import { webMngmtService } from '../../../services/web-mngmt.service';
import type { PortfolioItem } from '../../../services/category.service';
import type { AllTranslations } from '../../../services/web-mngmt.service';
import { Save } from 'lucide-react';

interface TopCakesViewProps {
  translations: AllTranslations;
  language: 'es' | 'en';
  onTranslationsUpdate: (lang: 'es' | 'en', data: Record<string, unknown>) => void;
}

const TopCakesView: React.FC<TopCakesViewProps> = ({
  translations,
  language,
  onTranslationsUpdate,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [topItems, setTopItems] = useState<PortfolioItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [localTranslations, setLocalTranslations] = useState<AllTranslations>(translations);

  const fetchTopItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await portfolioService.getContents({
        active: true,
        isTop: true,
        type: 'ITEM',
        limit: 5,
      });
      setTopItems(response.data);
    } catch (err) {
      console.error('Error fetching top items:', err);
      setError(t('common.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTopItems();
  }, [fetchTopItems]);

  useEffect(() => {
    setLocalTranslations(translations);
  }, [translations]);

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
      console.error('Error saving translations:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const websiteUrl = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:3001';
    window.open(websiteUrl, '_blank');
  };

  const getImageUrl = (image: string) => {
    if (image.startsWith('http')) return image;
    const assetsUrl = import.meta.env.VITE_ASSETS_URL || 'http://localhost:3000/assets';
    return `${assetsUrl}/category-items/${image}`;
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

      {/* Top Cakes List - Read Only */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('webContent.topCakes.cakesList')}
          </Typography>
          <Button
            size="small"
            startIcon={<RefreshCw size={16} />}
            onClick={fetchTopItems}
            disabled={loading}
          >
            {t('common.refresh', 'Refresh')}
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 1 }}>
          {t('webContent.topCakes.readOnlyInfo')}
        </Alert>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : topItems.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            {t('webContent.topCakes.noTopItems')}
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {topItems.map((item) => (
              <Card key={item.id} variant="outlined">
                <CardMedia
                  component="img"
                  height="140"
                  image={getImageUrl(item.image)}
                  alt={item.title}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Star size={16} fill="#FFD700" color="#FFD700" />
                    <Typography variant="subtitle2" noWrap>
                      {item.title}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Chip
                      label={t('common.active')}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                    <Chip
                      label={t('common.top')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        <Typography variant="caption" color="text.secondary">
          {t('webContent.topCakes.manageInPortfolio')}
        </Typography>
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

export default TopCakesView;
