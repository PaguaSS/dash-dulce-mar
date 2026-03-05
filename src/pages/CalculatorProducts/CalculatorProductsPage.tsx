import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import { Layers, Settings, DollarSign, Package } from 'lucide-react';
import CategoryList from './components/CategoryList';
import OptionList from './components/OptionList';
import PricingEditor from './components/PricingEditor';
import MainProductOptionsTab from './components/MainProductOptionsTab';

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
      id={`calculator-tabpanel-${index}`}
      aria-labelledby={`calculator-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const CalculatorProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {t('calculatorProducts.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('calculatorProducts.subtitle')}
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="calculator products tabs"
          >
            <Tab
              icon={<Layers size={18} />}
              iconPosition="start"
              label={t('calculatorProducts.tabs.categories')}
            />
            <Tab
              icon={<Settings size={18} />}
              iconPosition="start"
              label={t('calculatorProducts.tabs.options')}
            />
            <Tab
              icon={<DollarSign size={18} />}
              iconPosition="start"
              label={t('calculatorProducts.tabs.pricing')}
            />
            <Tab
              icon={<Package size={18} />}
              iconPosition="start"
              label={t('calculatorProducts.tabs.mainProducts')}
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <CategoryList />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <OptionList />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <PricingEditor />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <MainProductOptionsTab />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default CalculatorProductsPage;
