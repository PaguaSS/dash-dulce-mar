import React from 'react';
import { Box, Paper, Typography, Grid, Chip } from '@mui/material';
import type { Agenda } from '../../../types/agenda';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarGridProps {
  viewMode: 'day' | 'week' | 'month';
  currentDate: Date;
  items: Agenda[];
  onItemClick: (item: Agenda) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ viewMode, currentDate, items, onItemClick }) => {
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <Box sx={{ flexGrow: 1 }}>
        <Grid container columns={7} sx={{ mb: 1 }}>
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <Grid key={day} size={1} sx={{ textAlign: 'center', fontWeight: 'bold', py: 1 }}>
              {day}
            </Grid>
          ))}
        </Grid>
        <Grid container columns={7} sx={{ borderTop: 1, borderColor: 'divider', borderLeft: 1 }}>
          {days.map((day) => {
            const dayItems = items.filter((item) => isSameDay(new Date(item.bookDate), day));
            return (
              <Grid 
                key={day.toISOString()} 
                size={1} 
                sx={{ 
                  height: 120, 
                  borderRight: 1, 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  p: 1,
                  bgcolor: isSameMonth(day, monthStart) ? 'background.paper' : 'action.hover',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Typography variant="caption" color={isSameMonth(day, monthStart) ? 'text.primary' : 'text.disabled'}>
                  {format(day, 'd')}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {dayItems.slice(0, 3).map((item) => (
                    <Paper 
                      key={item.id} 
                      onClick={(e) => { e.stopPropagation(); onItemClick(item); }}
                      sx={{ 
                        p: 0.5, 
                        fontSize: '0.75rem', 
                        bgcolor: 'primary.light', 
                        color: 'primary.contrastText',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {item.description}
                    </Paper>
                  ))}
                  {dayItems.length > 3 && (
                    <Typography variant="caption" sx={{ pl: 0.5 }}>
                       +{dayItems.length - 3} más
                    </Typography>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {days.map((day) => {
           const dayItems = items.filter((item) => isSameDay(new Date(item.bookDate), day));
           return (
             <Paper key={day.toISOString()} sx={{ p: 2 }}>
               <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                 {format(day, 'EEEE d', { locale: es })}
               </Typography>
               <Box sx={{ minHeight: 100 }}>
                 {dayItems.map(item => (
                   <Box 
                     key={item.id} 
                     onClick={() => onItemClick(item)}
                     sx={{ 
                       p: 1, 
                       mb: 1, 
                       border: '1px solid', 
                       borderColor: 'divider', 
                       borderRadius: 1,
                       cursor: 'pointer',
                       '&:hover': { bgcolor: 'action.hover' }
                     }}
                   >
                     <Typography>{item.description}</Typography>
                     <Typography variant="caption" color="text.secondary">
                       {format(new Date(item.bookDate), 'HH:mm')}
                     </Typography>
                   </Box>
                 ))}
                 {dayItems.length === 0 && (
                   <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                     Sin eventos
                   </Typography>
                 )}
               </Box>
             </Paper>
           );
        })}
      </Box>
    );
  };

  const renderDayView = () => {
    const dayItems = items.filter((item) => isSameDay(new Date(item.bookDate), currentDate));

    return (
      <Paper sx={{ p: 3, minHeight: 400 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Eventos para {format(currentDate, 'PPP', { locale: es })}
        </Typography>
        {dayItems.length === 0 ? (
          <Typography color="text.secondary">No hay eventos programados para este día.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {dayItems.map((item) => (
              <Paper 
                key={item.id} 
                onClick={() => onItemClick(item)}
                elevation={3}
                sx={{ 
                   p: 2, 
                   cursor: 'pointer',
                   borderLeft: '4px solid',
                   borderColor: 'primary.main',
                   '&:hover': { transform: 'translateX(4px)', transition: '0.2s' }
                }}
              >
                <Typography variant="h6">{item.description}</Typography>
                <Typography variant="body2" color="text.secondary">
                   {format(new Date(item.bookDate), 'PPP p', { locale: es })}
                </Typography>
                {item.items && item.items.length > 0 && (
                    <Chip 
                        label={`${item.items.length} archivo(s) adjunto(s)`} 
                        size="small" 
                        color="secondary" 
                        sx={{ mt: 1, fontWeight: 'bold' }}
                    />
                )}
              </Paper>
            ))}
          </Box>
        )}
      </Paper>
    );
  };

  return (
    <Box>
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}
    </Box>
  );
};

export default CalendarGrid;
