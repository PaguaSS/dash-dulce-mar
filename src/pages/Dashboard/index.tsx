import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Button,
} from '@mui/material';
import { Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { agendaService } from '../../services/agenda.service';
import NotificationToggle from '../../components/NotificationToggle';
import type { Agenda } from '../../types/agenda';
import { format, isAfter, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [nextEvent, setNextEvent] = useState<Agenda | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNextEvent = async () => {
      try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const response = await agendaService.getAll({
          year: currentYear,
          month: currentMonth,
          limit: 100,
        });

        const today = startOfDay(now);
        const upcomingEvents = response.data
          .filter((event) => {
            const eventDate = startOfDay(new Date(event.bookDate));
            return isAfter(eventDate, today) || eventDate.getTime() === today.getTime();
          })
          .sort((a, b) => new Date(a.bookDate).getTime() - new Date(b.bookDate).getTime());

        setNextEvent(upcomingEvents.length > 0 ? upcomingEvents[0] : null);
      } catch (error) {
        console.error('Failed to fetch next event', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNextEvent();
  }, []);

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'es' ? es : undefined;
    return format(date, "EEEE, d 'de' MMMM", { locale });
  };

  const getDaysUntil = (dateString: string) => {
    const eventDate = startOfDay(new Date(dateString));
    const today = startOfDay(new Date());
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        {t('dashboard.title')}
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
        {/* Next Event Card */}
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Calendar size={24} color="#FF3399" />
              <Typography variant="h6" fontWeight="bold">
                {t('dashboard.nextEvent')}
              </Typography>
            </Box>

            {loading ? (
              <Box>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="40%" />
              </Box>
            ) : nextEvent ? (
              <Box>
                <Typography variant="body1" fontWeight="medium" sx={{ mb: 1 }}>
                  {nextEvent.description}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                  {formatEventDate(nextEvent.bookDate)}
                </Typography>
                {(() => {
                  const daysUntil = getDaysUntil(nextEvent.bookDate);
                  if (daysUntil === 0) {
                    return (
                      <Typography variant="body2" color="primary" fontWeight="bold" sx={{ mt: 1 }}>
                        {t('dashboard.today')}
                      </Typography>
                    );
                  } else if (daysUntil === 1) {
                    return (
                      <Typography variant="body2" color="warning.main" fontWeight="bold" sx={{ mt: 1 }}>
                        {t('dashboard.tomorrow')}
                      </Typography>
                    );
                  } else {
                    return (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {t('dashboard.daysUntil', { count: daysUntil })}
                      </Typography>
                    );
                  }
                })()}
                <Button
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/dashboard/agenda')}
                >
                  {t('dashboard.viewAgenda')}
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.noEventsThisMonth')}
                </Typography>
                <Button
                  size="small"
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/dashboard/agenda')}
                >
                  {t('dashboard.viewAgenda')}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <NotificationToggle />
      </Box>
    </Box>
  );
};

export default Dashboard;
