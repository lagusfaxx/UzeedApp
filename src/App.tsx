import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/hooks/usePush';
import { AppShell } from '@/components/AppShell';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AuthScreen } from '@/screens/AuthScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { WalletScreen } from '@/screens/WalletScreen';
import { ChatInbox, ChatConversation } from '@/screens/ChatScreen';
import { LivesScreen } from '@/screens/LivesScreen';
import { LiveWatchScreen } from '@/screens/LiveWatchScreen';
import { BroadcastScreen } from '@/screens/BroadcastScreen';
import { VideocallScreen } from '@/screens/VideocallScreen';
import { DiscoverScreen } from '@/screens/DiscoverScreen';
import { ProfessionalViewScreen } from '@/screens/ProfessionalViewScreen';
import { VideocallConfigScreen } from '@/screens/VideocallConfigScreen';

function AppRoutes() {
  const { user, loading } = useAuth();
  usePushNotifications();

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthScreen />;

  const isPro = user.profileType === 'PROFESSIONAL';
  const defaultRoute = isPro ? '/perfil' : '/explorar';

  return (
    <Routes>
      {/* Tabbed screens */}
      <Route element={<AppShell />}>
        <Route path="/perfil" element={<ProfileScreen />} />
        <Route path="/billetera" element={<WalletScreen />} />
        <Route path="/chat" element={<ChatInbox />} />
        <Route path="/lives" element={<LivesScreen />} />
        <Route path="/explorar" element={<DiscoverScreen />} />
      </Route>

      {/* Full-screen screens (no bottom nav) */}
      <Route path="/chat/:userId" element={<ChatConversation />} />
      <Route path="/profesional/:username" element={<ProfessionalViewScreen />} />
      <Route path="/videocall-config" element={<VideocallConfigScreen />} />
      <Route path="/lives/watch/:streamId" element={<LiveWatchScreen />} />
      <Route path="/lives/broadcast" element={<BroadcastScreen />} />
      <Route path="/lives/call/:bookingId" element={<VideocallScreen />} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
