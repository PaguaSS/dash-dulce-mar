import React, { useState, useEffect } from 'react';
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
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Save, Plus, Trash2, GripVertical, ExternalLink, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { webMngmtService } from '../../../services/web-mngmt.service';
import type { FooterContent, FooterColumn, FooterLink, SocialLink, AllTranslations } from '../../../services/web-mngmt.service';
import { socialNetService, type SocialNet } from '../../../services/social-net.service';

interface FooterFormProps {
  content: FooterContent;
  translations: AllTranslations;
  language: 'es' | 'en';
  onContentUpdate: (data: FooterContent) => void;
  onTranslationsUpdate: (lang: 'es' | 'en', data: Record<string, unknown>) => void;
}



const FooterForm: React.FC<FooterFormProps> = ({
  content,
  translations,
  language,
  onContentUpdate,
  onTranslationsUpdate,
}) => {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [socialNets, setSocialNets] = useState<SocialNet[]>([]);

  const [footerContent, setFooterContent] = useState<FooterContent>(content);
  const [localTranslations, setLocalTranslations] = useState<AllTranslations>(translations);

  useEffect(() => {
    socialNetService.getAll().then((data) => {
      setSocialNets(data.data.filter((net: SocialNet) => net.active));
    }).catch(() => {
        toast.error('Failed to load social networks');
    });
  }, []);

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

  // Column management
  const handleAddColumn = () => {
    const newColumnKey = `column_${Date.now()}`;
    const newColumn: FooterColumn = {
      key: newColumnKey,
      links: [],
    };
    setFooterContent({ ...footerContent, columns: [...footerContent.columns, newColumn] });

    // Initialize translations
    const esData = JSON.parse(JSON.stringify(localTranslations.es));
    const enData = JSON.parse(JSON.stringify(localTranslations.en));
    if (!esData.footer) esData.footer = { columns: {}, links: {} };
    if (!esData.footer.columns) esData.footer.columns = {};
    if (!enData.footer) enData.footer = { columns: {}, links: {} };
    if (!enData.footer.columns) enData.footer.columns = {};

    esData.footer.columns[newColumnKey] = 'Nueva Columna';
    enData.footer.columns[newColumnKey] = 'New Column';
    setLocalTranslations({ es: esData, en: enData });
  };

  const handleRemoveColumn = (index: number) => {
    const column = footerContent.columns[index];
    const newColumns = footerContent.columns.filter((_, i) => i !== index);
    setFooterContent({ ...footerContent, columns: newColumns });

    // Remove column and its link translations
    const esData = JSON.parse(JSON.stringify(localTranslations.es));
    const enData = JSON.parse(JSON.stringify(localTranslations.en));

    if (esData.footer?.columns) delete esData.footer.columns[column.key];
    if (enData.footer?.columns) delete enData.footer.columns[column.key];

    // Remove link translations
    column.links.forEach((link) => {
      if (esData.footer?.links) delete esData.footer.links[link.key];
      if (enData.footer?.links) delete enData.footer.links[link.key];
    });

    setLocalTranslations({ es: esData, en: enData });
  };

  // Link management
  const handleAddLink = (columnIndex: number) => {
    const newLinkKey = `link_${Date.now()}`;
    const newLink: FooterLink = {
      key: newLinkKey,
      href: '/',
      isExternal: false,
    };

    const newColumns = [...footerContent.columns];
    newColumns[columnIndex] = {
      ...newColumns[columnIndex],
      links: [...newColumns[columnIndex].links, newLink],
    };
    setFooterContent({ ...footerContent, columns: newColumns });

    // Initialize link translations
    const esData = JSON.parse(JSON.stringify(localTranslations.es));
    const enData = JSON.parse(JSON.stringify(localTranslations.en));
    if (!esData.footer) esData.footer = { links: {} };
    if (!esData.footer.links) esData.footer.links = {};
    if (!enData.footer) enData.footer = { links: {} };
    if (!enData.footer.links) enData.footer.links = {};

    esData.footer.links[newLinkKey] = 'Nuevo Enlace';
    enData.footer.links[newLinkKey] = 'New Link';
    setLocalTranslations({ es: esData, en: enData });
  };

  const handleRemoveLink = (columnIndex: number, linkIndex: number) => {
    const link = footerContent.columns[columnIndex].links[linkIndex];
    const newColumns = [...footerContent.columns];
    newColumns[columnIndex] = {
      ...newColumns[columnIndex],
      links: newColumns[columnIndex].links.filter((_, i) => i !== linkIndex),
    };
    setFooterContent({ ...footerContent, columns: newColumns });

    // Remove link translations
    const esData = JSON.parse(JSON.stringify(localTranslations.es));
    const enData = JSON.parse(JSON.stringify(localTranslations.en));
    if (esData.footer?.links) delete esData.footer.links[link.key];
    if (enData.footer?.links) delete enData.footer.links[link.key];
    setLocalTranslations({ es: esData, en: enData });
  };

  const handleLinkChange = (
    columnIndex: number,
    linkIndex: number,
    field: keyof FooterLink,
    value: string | boolean
  ) => {
    const newColumns = [...footerContent.columns];
    newColumns[columnIndex] = {
      ...newColumns[columnIndex],
      links: newColumns[columnIndex].links.map((link, i) =>
        i === linkIndex ? { ...link, [field]: value } : link
      ),
    };
    setFooterContent({ ...footerContent, columns: newColumns });
  };

  // Social links management
  const handleAddSocialLink = () => {
    const newSocial: SocialLink = {
      platform: 'instagram',
      url: '',
    };
    setFooterContent({
      ...footerContent,
      socialLinks: [...footerContent.socialLinks, newSocial],
    });
  };

  const handleRemoveSocialLink = (index: number) => {
    setFooterContent({
      ...footerContent,
      socialLinks: footerContent.socialLinks.filter((_, i) => i !== index),
    });
  };

  const handleSocialLinkChange = (
    index: number,
    field: keyof SocialLink,
    value: string
  ) => {
    const newSocialLinks = [...footerContent.socialLinks];
    
    if (field === 'platform') {
        const selectedNet = socialNets.find(net => net.title === value);
        if (selectedNet && selectedNet.src) {
             newSocialLinks[index] = { ...newSocialLinks[index], platform: value, url: selectedNet.src };
             setFooterContent({ ...footerContent, socialLinks: newSocialLinks });
             return;
        }
    }

    newSocialLinks[index] = { ...newSocialLinks[index], [field]: value } as SocialLink;
    setFooterContent({ ...footerContent, socialLinks: newSocialLinks });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await webMngmtService.updateContentBySection('footer', footerContent);

      await Promise.all([
        webMngmtService.updateTranslationByLanguage('es', localTranslations.es),
        webMngmtService.updateTranslationByLanguage('en', localTranslations.en),
      ]);

      onContentUpdate(footerContent);
      onTranslationsUpdate('es', localTranslations.es);
      onTranslationsUpdate('en', localTranslations.en);

      toast.success(t('common.updateSuccess'));
    } catch (error) {
      toast.error(t('common.updateError'));
      console.error('Error saving footer content:', error);
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
        {t('webContent.footer.title')}
      </Typography>

      {/* Footer header translations */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {t('webContent.translatableContent')} ({language.toUpperCase()})
        </Typography>

        <TextField
          label={t('webContent.footer.tagline')}
          value={getTranslation(language, 'footer.tagline')}
          onChange={(e) => setTranslation(language, 'footer.tagline', e.target.value)}
          fullWidth
        />

        <TextField
          label={t('webContent.footer.brandDescription')}
          value={getTranslation(language, 'footer.brandDescription')}
          onChange={(e) => setTranslation(language, 'footer.brandDescription', e.target.value)}
          fullWidth
          multiline
          rows={2}
        />
      </Box>

      <Divider />

      {/* Footer columns */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('webContent.footer.columns')}
          </Typography>
          <Button startIcon={<Plus size={18} />} size="small" onClick={handleAddColumn}>
            {t('webContent.footer.addColumn')}
          </Button>
        </Box>

        {footerContent.columns.map((column, columnIndex) => (
          <Accordion key={column.key} defaultExpanded={columnIndex === 0}>
            <AccordionSummary expandIcon={<ChevronDown size={20} />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <GripVertical size={18} style={{ cursor: 'grab', color: '#999' }} />
                <Typography sx={{ flex: 1 }}>
                  {getTranslation(language, `footer.columns.${column.key}`) || `Column ${columnIndex + 1}`}
                </Typography>
                <IconButton
                  color="error"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveColumn(columnIndex);
                  }}
                >
                  <Trash2 size={16} />
                </IconButton>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label={t('webContent.footer.columnTitle')}
                  value={getTranslation(language, `footer.columns.${column.key}`)}
                  onChange={(e) => setTranslation(language, `footer.columns.${column.key}`, e.target.value)}
                  fullWidth
                  size="small"
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('webContent.footer.links')}
                  </Typography>
                  <Button
                    startIcon={<Plus size={16} />}
                    size="small"
                    onClick={() => handleAddLink(columnIndex)}
                  >
                    {t('webContent.footer.addLink')}
                  </Button>
                </Box>

                {column.links.map((link, linkIndex) => (
                  <Paper key={link.key} variant="outlined" sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            label={t('webContent.footer.linkLabel')}
                            value={getTranslation(language, `footer.links.${link.key}`)}
                            onChange={(e) => setTranslation(language, `footer.links.${link.key}`, e.target.value)}
                            size="small"
                            sx={{ flex: 1 }}
                          />
                          <TextField
                            label={t('webContent.footer.linkUrl')}
                            value={link.href}
                            onChange={(e) => handleLinkChange(columnIndex, linkIndex, 'href', e.target.value)}
                            size="small"
                            sx={{ flex: 1 }}
                          />
                        </Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={link.isExternal}
                              onChange={(e) =>
                                handleLinkChange(columnIndex, linkIndex, 'isExternal', e.target.checked)
                              }
                              size="small"
                            />
                          }
                          label={t('webContent.footer.isExternal')}
                        />
                      </Box>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleRemoveLink(columnIndex, linkIndex)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}

                {column.links.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                    {t('webContent.footer.noLinks')}
                  </Typography>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}

        {footerContent.columns.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            {t('webContent.footer.noColumns')}
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Social links */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            {t('webContent.footer.socialLinks')}
          </Typography>
          <Button startIcon={<Plus size={18} />} size="small" onClick={handleAddSocialLink}>
            {t('webContent.footer.addSocial')}
          </Button>
        </Box>

        {footerContent.socialLinks.map((social, index) => (
          <Paper key={index} variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>{t('webContent.footer.platform')}</InputLabel>
                <Select
                  value={social.platform}
                  label={t('webContent.footer.platform')}
                  onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                >
                  {socialNets.map((net) => (
                    <MenuItem key={net.id} value={net.title}>
                      {`${net.title} (${net.profileName})`}
                    </MenuItem>
                  ))}
                  {/* Fallback for existing values that might not be in the list anymore */}
                  {!socialNets.find(n => n.title === social.platform) && social.platform && (
                       <MenuItem value={social.platform}>{social.platform}</MenuItem>
                  )}
                </Select>
              </FormControl>

              <TextField
                label={t('webContent.footer.socialUrl')}
                value={social.url}
                onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                fullWidth
                size="small"
                placeholder="https://..."
              />

              <IconButton color="error" onClick={() => handleRemoveSocialLink(index)}>
                <Trash2 size={18} />
              </IconButton>
            </Box>
          </Paper>
        ))}

        {footerContent.socialLinks.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            {t('webContent.footer.noSocials')}
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

export default FooterForm;
