import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

export const notificationsUpdatedEvent =
  'kalingalink:notifications-updated';

type NotificationCountResponse = {
  data: { unread_count: number };
};

export function useNotificationCount() {
  const { request, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      const response = await request<NotificationCountResponse>(
        '/api/notifications/count',
      );
      if (isActive()) setUnreadCount(response.data.unread_count);
    } catch (error) {
      if (isActive()) {
        console.error('Notification count could not be refreshed.', error);
      }
    }
  }, [request]);

  useEffect(() => {
    let active = true;
    setUnreadCount(0);
    const update = () => {
      if (active && document.visibilityState === 'visible') {
        void refresh(() => active);
      }
    };
    void refresh(() => active);
    if (user?.role === 'teacher') {
      window.addEventListener(notificationsUpdatedEvent, update);
      return () => {
        active = false;
        window.removeEventListener(notificationsUpdatedEvent, update);
      };
    }
    const interval = window.setInterval(update, 15_000);
    window.addEventListener('focus', update);
    window.addEventListener(notificationsUpdatedEvent, update);
    document.addEventListener('visibilitychange', update);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', update);
      window.removeEventListener(notificationsUpdatedEvent, update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [refresh, user?.id, user?.role]);

  return unreadCount;
}
