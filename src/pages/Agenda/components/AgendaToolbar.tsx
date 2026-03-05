import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Typography,
  Button,
  TextField,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AgendaToolbarProps {
  viewMode: 'day' | 'week' | 'month';
  onViewChange: (mode: 'day' | 'week' | 'month') => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onAddClick: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const AgendaToolbar: React.FC<AgendaToolbarProps> = ({
  viewMode,
  onViewChange,
  currentDate,
  onDateChange,
  onAddClick,
  searchTerm,
  onSearchChange,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(currentDate.getDate() - 1);
    if (viewMode === 'week') newDate.setDate(currentDate.getDate() - 7);
    if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(currentDate.getDate() + 1);
    if (viewMode === 'week') newDate.setDate(currentDate.getDate() + 7);
    if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', maxWidth: '70%' }}>
          <Chip 
            label={t('agenda.views.day')} 
            onClick={() => onViewChange('day')} 
            color={viewMode === 'day' ? 'primary' : 'default'} 
            variant={viewMode === 'day' ? 'filled' : 'outlined'}
            size={isMobile ? "small" : "medium"}
          />
          <Chip 
            label={t('agenda.views.week')} 
            onClick={() => onViewChange('week')} 
            color={viewMode === 'week' ? 'primary' : 'default'}
            variant={viewMode === 'week' ? 'filled' : 'outlined'}
            size={isMobile ? "small" : "medium"}
          />
          <Chip 
            label={t('agenda.views.month')} 
            onClick={() => onViewChange('month')} 
            color={viewMode === 'month' ? 'primary' : 'default'}
            variant={viewMode === 'month' ? 'filled' : 'outlined'}
            size={isMobile ? "small" : "medium"}
          />
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus size={20} />} 
          onClick={onAddClick}
          sx={{ borderRadius: 2, minWidth: isMobile ? 40 : 64 }}
          size={isMobile ? "small" : "medium"}
        >
          {isMobile ? '' : t('agenda.add')}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'flex-start', gap: 1 }}>
          <IconButton onClick={handlePrev} size={isMobile ? "small" : "medium"}>
            <ChevronLeft size={isMobile ? 20 : 24} />
          </IconButton>
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ minWidth: isMobile ? 150 : 200, textAlign: 'center', fontWeight: 'bold' }}>
            {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : 'd MMMM yyyy', { locale: es })}
          </Typography>
          <IconButton onClick={handleNext} size={isMobile ? "small" : "medium"}>
            <ChevronRight size={isMobile ? 20 : 24} />
          </IconButton>
          {!isMobile && (
            <Button onClick={handleToday} size="small" sx={{ ml: 1 }}>
                {t('common.today')}
            </Button>
          )}
        </Box>
        
        {isMobile && (
             <Button onClick={handleToday} variant="outlined" size="small" fullWidth sx={{ mb: 1 }}>
                {t('common.today')}
            </Button>
        )}

        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
            <TextField
            size="small"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            slotProps={{
                input: {
                    startAdornment: <Search size={20} style={{ marginRight: 8, opacity: 0.5 }} />,
                }
            }}
            sx={{ width: isMobile ? '100%' : 250 }}
            />
            <DatePicker 
                label={t('common.goToDate')}
                value={currentDate}
                onChange={(newValue) => {
                    if(newValue) onDateChange(newValue);
                }}
                slotProps={{ textField: { size: 'small', sx: { width: isMobile ? '100%' : 180 } } }}
            />
        </Box>
      </Box>
    </Box>
  );
};

export default AgendaToolbar;
