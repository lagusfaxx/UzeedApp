import { useLocation, useNavigate } from 'react-router-dom';
import { User, Wallet, MessageCircle, Video, Radio } from 'lucide-react';

const tabs = [
  { path: '/perfil', icon: User, label: 'Perfil' },
  { path: '/billetera', icon: Wallet, label: 'Billetera' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/lives', icon: Radio, label: 'Lives' },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border safe-bottom z-50">
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors ${
                active ? 'text-primary' : 'text-neutral-500'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
