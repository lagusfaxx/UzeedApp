import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Wallet, MessageCircle, Radio, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const isPro = user?.profileType === 'PROFESSIONAL';

  useEffect(() => {
    api.get<{ count: number }>('/messages/unread-count')
      .then(({ count }) => setUnread(count))
      .catch(() => {});

    const interval = setInterval(() => {
      api.get<{ count: number }>('/messages/unread-count')
        .then(({ count }) => setUnread(count))
        .catch(() => {});
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Ping online status every 2 minutes
  useEffect(() => {
    api.post('/auth/ping').catch(() => {});
    const interval = setInterval(() => {
      api.post('/auth/ping').catch(() => {});
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  const tabs = isPro
    ? [
        { path: '/perfil', icon: User, label: 'Perfil' },
        { path: '/billetera', icon: Wallet, label: 'Billetera' },
        { path: '/chat', icon: MessageCircle, label: 'Chat', badge: unread },
        { path: '/lives', icon: Radio, label: 'Lives' },
      ]
    : [
        { path: '/explorar', icon: Search, label: 'Explorar' },
        { path: '/billetera', icon: Wallet, label: 'Billetera' },
        { path: '/chat', icon: MessageCircle, label: 'Chat', badge: unread },
        { path: '/lives', icon: Radio, label: 'Lives' },
        { path: '/perfil', icon: User, label: 'Perfil' },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-t border-border safe-bottom z-50">
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ path, icon: Icon, label, badge }) => {
          const active = location.pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors relative ${
                active ? 'text-primary' : 'text-neutral-500'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-danger text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
