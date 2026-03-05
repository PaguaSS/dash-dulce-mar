import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { webMngmtService } from '../../services/web-mngmt.service';
import type { SiteContent, AllTranslations } from '../../services/web-mngmt.service';
import HeroForm from './components/HeroForm';
import TopCakesView from './components/TopCakesView';
import FooterForm from './components/FooterForm';
import HomeActionsForm from './components/HomeActionsForm';
import AboutUsForm from './components/AboutUsForm';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`webcontent-tabpanel-${index}`}
      aria-labelledby={`webcontent-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const WebContentPage: React.FC = () => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [content, setContent] = useState<SiteContent | null>(null);
  const [translations, setTranslations] = useState<AllTranslations | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [contentData, translationsData] = await Promise.all([
          webMngmtService.getAllContent(),
          webMngmtService.getAllTranslations(),
        ]);
        if (!cancelled) {
          setContent(contentData);
          setTranslations(translationsData);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Error loading content');
          console.error('Error fetching web content:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleLanguageChange = (
    _event: React.MouseEvent<HTMLElement>,
    newLanguage: 'es' | 'en' | null
  ) => {
    if (newLanguage !== null) {
      setLanguage(newLanguage);
    }
  };

  const handleContentUpdate = (section: keyof SiteContent, data: SiteContent[keyof SiteContent]) => {
    if (content) {
      setContent({ ...content, [section]: data });
    }
  };

  const handleTranslationsUpdate = (lang: 'es' | 'en', data: Record<string, unknown>) => {
    if (translations) {
      setTranslations({ ...translations, [lang]: data });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            {t('webContent.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('webContent.subtitle')}
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={language}
          exclusive
          onChange={handleLanguageChange}
          aria-label="language selection"
          size="small"
        >
          <ToggleButton value="es" aria-label="Spanish">
            ES
          </ToggleButton>
          <ToggleButton value="en" aria-label="English">
            EN
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label={t('webContent.tabs.hero')} />
          <Tab label={t('webContent.tabs.topCakes')} />
          <Tab label={t('webContent.tabs.home')} />
          <Tab label={t('webContent.tabs.about')} />
          <Tab label={t('webContent.tabs.footer')} />
        </Tabs>
      </Paper>

      {content && translations && (
        <>
          <TabPanel value={tabValue} index={0}>
            <Paper sx={{ p: 3 }}>
              <HeroForm
                content={content.hero}
                translations={translations}
                language={language}
                onContentUpdate={(data) => handleContentUpdate('hero', data)}
                onTranslationsUpdate={handleTranslationsUpdate}
              />
            </Paper>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Paper sx={{ p: 3 }}>
              <TopCakesView
                translations={translations}
                language={language}
                onTranslationsUpdate={handleTranslationsUpdate}
              />
            </Paper>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Paper sx={{ p: 3 }}>
              <HomeActionsForm
                translations={translations}
                language={language}
                onTranslationsUpdate={handleTranslationsUpdate}
              />
            </Paper>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Paper sx={{ p: 3 }}>
              <AboutUsForm
                content={content.aboutUs}
                translations={translations}
                language={language}
                onContentUpdate={(data) => handleContentUpdate('aboutUs', data)}
                onTranslationsUpdate={handleTranslationsUpdate}
              />
            </Paper>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Paper sx={{ p: 3 }}>
              <FooterForm
                content={content.footer}
                translations={translations}
                language={language}
                onContentUpdate={(data) => handleContentUpdate('footer', data)}
                onTranslationsUpdate={handleTranslationsUpdate}
              />
            </Paper>
          </TabPanel>
        </>
      )}
    </Box>
  );
};

export default WebContentPage;
