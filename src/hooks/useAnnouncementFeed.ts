import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

export type AnnouncementFeedItem = {
  id: number;
  title: string;
  message: string;
  category: string;
  audience: 'parents' | 'teachers' | 'all-users';
  status: 'draft' | 'published' | 'scheduled';
  created_at: string;
  published_at: string;
  created_by: string;
  created_by_role: 'admin' | 'teacher' | 'parent';
  attachment: {
    name: string;
    mime_type: string;
    size: number;
    download_url: string;
  } | null;
};

type AnnouncementFeedResponse = {
  status: boolean;
  data: AnnouncementFeedItem[];
};

export function useAnnouncementFeed(autoRefresh = true) {
  const { request } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await request<AnnouncementFeedResponse>('/api/announcements');
      setAnnouncements(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load announcements.');
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void reload();
    if (!autoRefresh) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void reload();
    }, 30_000);
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') void reload();
    };
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, [autoRefresh, reload]);

  return { announcements, loading, error };
}
