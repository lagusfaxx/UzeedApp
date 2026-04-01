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

function AppRoutes() {
  const { user, loading } = useAuth();
  usePushNotifications();

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthScreen />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/perfil" element={<ProfileScreen />} />
        <Route path="/billetera" element={<WalletScreen />} />
        <Route path="/chat" element={<ChatInbox />} />
        <Route path="/lives" element={<LivesScreen />} />
      </Route>
      <Route path="/chat/:userId" element={<ChatConversation />} />
      <Route path="/lives/watch/:streamId" element={<LiveWatchScreen />} />
      <Route path="/lives/broadcast" element={<BroadcastScreen />} />
      <Route path="/lives/call/:bookingId" element={<VideocallScreen />} />
      <Route path="*" element={<Navigate to="/perfil" replace />} />
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
