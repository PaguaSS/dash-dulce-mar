import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Switch,
  CircularProgress,
} from '@mui/material';
import { Bell, BellOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../hooks/useNotifications';
import { notificationService } from '../services/notification.service';
import toast from 'react-hot-toast';

const NotificationToggle: React.FC = () => {
  const { t } = useTranslation();
  const {
    subscribe,
    unsubscribe,
    isSubscribed,
    isLoading,
    isSupported,
    isBlocked,
  } = useNotifications();

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      const success = await subscribe();
      if (success) {
        toast.success(t('notifications.subscribed'));
      } else if (isBlocked) {
        toast.error(t('notifications.blocked'));
      } else {
        toast.error(t('notifications.permissionDenied'));
      }
    } else {
      const success = await unsubscribe();
      if (success) {
        toast.success(t('notifications.unsubscribed'));
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {isSubscribed ? (
            <Bell size={24} color="#FF3399" />
          ) : (
            <BellOff size={24} color="#999" />
          )}
          <Typography variant="h6" fontWeight="bold">
            {t('notifications.title')}
          </Typography>
        </Box>

        {isBlocked ? (
          <Typography variant="body2" color="text.secondary">
            {t('notifications.blocked')}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2">
              {t('notifications.enableReminders')}
            </Typography>
            {isLoading ? (
              <CircularProgress size={24} />
            ) : (
              <Switch
                checked={isSubscribed}
                onChange={(_, checked) => handleToggle(checked)}
                color="primary"
              />
            )}
          </Box>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {t('notifications.description')}
        </Typography>

        {isSubscribed && (
          <Box sx={{ mt: 2 }}>
            <button
              onClick={async () => {
                try {
                  await notificationService.sendTestNotification();
                  toast.success(t('notifications.testSent'));
                } catch (error) {
                  toast.error(t('notifications.testFailed'));
                }
              }}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #FF3399',
                backgroundColor: 'transparent',
                color: '#FF3399',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Bell size={18} />
              {t('notifications.sendTest')}
            </button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationToggle;
