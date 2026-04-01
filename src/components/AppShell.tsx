import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppShell() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-16">
      <Outlet />
      <BottomNav />
    </div>
  );
}
