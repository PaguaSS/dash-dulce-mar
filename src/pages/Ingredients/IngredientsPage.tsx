
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import IngredientList from './Components/IngredientList';
import MetricList from './Components/MetricList';
import BrandList from './Components/BrandList';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const IngredientsPage: React.FC = () => {
  const { t } = useTranslation();
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          {t('ingredients.title', 'Ingredients Management')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('ingredients.subtitle', 'Manage your ingredients and units of measurement')}
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth" 
        >
          <Tab label={t('ingredients.tab.ingredients', 'Ingredients')} />
          <Tab label={t('ingredients.tab.metrics', 'Units (Metrics)')} />
          <Tab label={t('ingredients.tab.brands', 'Brands')} />
        </Tabs>
      </Paper>

      <TabPanel value={value} index={0}>
        <Paper sx={{ p: 2 }}>
            <IngredientList />
        </Paper>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Paper sx={{ p: 2 }}>
            <MetricList />
        </Paper>
      </TabPanel>
      <TabPanel value={value} index={2}>
        <Paper sx={{ p: 2 }}>
            <BrandList />
        </Paper>
      </TabPanel>
    </Box>
  );
};

export default IngredientsPage;
