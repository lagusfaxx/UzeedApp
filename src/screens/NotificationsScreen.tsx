import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Bell, Check, CheckCheck, Trash2, RefreshCw, MessageCircle, Video, Coins, Star, Radio } from 'lucide-react';

interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

const TYPE_ICONS: Record<string, any> = {
  MESSAGE: MessageCircle,
  VIDEOCALL: Video,
  LIVE: Radio,
  WALLET: Coins,
  REVIEW: Star,
};

const TYPE_COLORS: Record<string, string> = {
  MESSAGE: 'bg-primary/15 text-primary',
  VIDEOCALL: 'bg-success/15 text-success',
  LIVE: 'bg-danger/15 text-danger',
  WALLET: 'bg-warning/15 text-warning',
  REVIEW: 'bg-yellow-500/15 text-yellow-500',
};

export function NotificationsScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ notifications: AppNotification[] }>(
        `/notifications?limit=50${filter === 'unread' ? '&unread=true' : ''}`
      );
      setNotifications(data.notifications || []);
    } catch {
      // Endpoint may not exist
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Ignore
    }
  };

  const markRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // Ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="safe-top">
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-primary" />
          <h1 className="text-xl font-bold">Notificaciones</h1>
          {unreadCount > 0 && (
            <span className="bg-danger text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-primary text-xs font-semibold px-2 py-1"
            >
              <CheckCheck size={18} />
            </button>
          )}
          <button onClick={fetchNotifications} className="text-neutral-400 p-2" disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="px-5 mb-3">
        <div className="flex bg-surface rounded-xl p-1 gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              filter === 'all' ? 'bg-surface-light text-white' : 'text-neutral-500'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              filter === 'unread' ? 'bg-surface-light text-white' : 'text-neutral-500'
            }`}
          >
            Sin leer
          </button>
        </div>
      </div>

      <div className="px-5 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-surface rounded-2xl p-8 text-center">
            <Bell size={36} className="text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 font-medium">Sin notificaciones</p>
            <p className="text-neutral-600 text-sm mt-1">
              {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'Las notificaciones aparecerán aquí'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const Icon = TYPE_ICONS[notif.type] || Bell;
              const colorClass = TYPE_COLORS[notif.type] || 'bg-surface-light text-neutral-400';

              return (
                <button
                  key={notif.id}
                  onClick={() => !notif.isRead && markRead(notif.id)}
                  className={`w-full text-left bg-surface rounded-2xl p-4 flex items-start gap-3 transition-colors ${
                    !notif.isRead ? 'border-l-2 border-primary' : ''
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${!notif.isRead ? 'text-white' : 'text-neutral-300'}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{notif.body}</p>
                    <p className="text-[10px] text-neutral-600 mt-1.5">
                      {formatRelativeTime(notif.createdAt)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}
