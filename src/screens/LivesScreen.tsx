import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { LiveStream, VideocallBooking } from '@/lib/types';
import {
  Radio, Video, Users, Play, PhoneCall, Calendar,
  Clock, RefreshCw, Plus, Eye
} from 'lucide-react';

export function LivesScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'lives' | 'videocalls'>('lives');
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [bookings, setBookings] = useState<VideocallBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'lives') {
        const data = await api.get<{ streams: LiveStream[] }>('/live/active');
        setStreams(data.streams || []);
      } else {
        const data = await api.get<{ bookings: VideocallBooking[] }>('/videocall/my-bookings');
        setBookings(data.bookings || []);
      }
    } catch {
      // Endpoint may not exist yet
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStartLive = async () => {
    navigate('/lives/broadcast');
  };

  const handleJoinStream = (streamId: string) => {
    navigate(`/lives/watch/${streamId}`);
  };

  const handleJoinCall = (bookingId: string) => {
    navigate(`/lives/call/${bookingId}`);
  };

  return (
    <div className="safe-top">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">Lives & Videollamadas</h1>
        <button onClick={fetchData} className="text-neutral-400 p-2" disabled={loading}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="px-5 mb-4">
        <div className="flex bg-surface rounded-xl p-1">
          <button
            onClick={() => setTab('lives')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'lives' ? 'bg-primary text-white' : 'text-neutral-400'
            }`}
          >
            <Radio size={14} />
            Lives
          </button>
          <button
            onClick={() => setTab('videocalls')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'videocalls' ? 'bg-primary text-white' : 'text-neutral-400'
            }`}
          >
            <Video size={14} />
            Videollamadas
          </button>
        </div>
      </div>

      <div className="px-5 pb-6">
        {/* Start live button for professionals */}
        {tab === 'lives' && user?.profileType === 'PROFESSIONAL' && (
          <button
            onClick={handleStartLive}
            className="w-full bg-danger/15 hover:bg-danger/25 border border-danger/30 text-danger font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 mb-5 transition-colors"
          >
            <Radio size={18} />
            Iniciar transmisión en vivo
          </button>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'lives' ? (
          /* Lives list */
          streams.length === 0 ? (
            <EmptyState icon={Radio} title="Sin lives activos" subtitle="No hay transmisiones en vivo ahora" />
          ) : (
            <div className="space-y-3">
              {streams.map((stream) => (
                <button
                  key={stream.id}
                  onClick={() => handleJoinStream(stream.id)}
                  className="w-full bg-surface hover:bg-surface-light rounded-2xl p-4 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {stream.host?.avatarUrl ? (
                      <img src={stream.host.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-surface-light flex items-center justify-center">
                        <Radio size={20} className="text-danger" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-danger/20 text-danger text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-danger rounded-full animate-pulse" />
                          EN VIVO
                        </span>
                      </div>
                      <p className="font-semibold text-sm mt-1 truncate">
                        {stream.host?.displayName || 'Transmisor'}
                      </p>
                      {stream.title && (
                        <p className="text-xs text-neutral-400 truncate">{stream.title}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-neutral-500 shrink-0">
                      <Eye size={14} />
                      <span className="text-xs">{stream.viewerCount}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          /* Videocalls list */
          bookings.length === 0 ? (
            <EmptyState icon={Video} title="Sin videollamadas" subtitle="Tus videollamadas agendadas aparecerán aquí" />
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const isProfessional = booking.professionalId === user?.id;
                const otherUser = isProfessional ? booking.client : booking.professional;
                const canJoin = ['CONFIRMED', 'IN_PROGRESS'].includes(booking.status);

                return (
                  <div key={booking.id} className="bg-surface rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      {otherUser?.avatarUrl ? (
                        <img src={otherUser.avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-surface-light flex items-center justify-center text-neutral-500">
                          <Video size={18} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">
                          {otherUser?.displayName || 'Usuario'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Calendar size={12} className="text-neutral-500" />
                          <span className="text-xs text-neutral-400">
                            {new Date(booking.scheduledAt).toLocaleDateString('es-CL', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock size={12} className="text-neutral-500" />
                          <span className="text-xs text-neutral-400">{booking.durationMinutes} min</span>
                          <span className="text-xs text-neutral-500">|</span>
                          <span className="text-xs text-primary-light">{booking.totalTokens} tokens</span>
                        </div>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>

                    {canJoin && (
                      <button
                        onClick={() => handleJoinCall(booking.id)}
                        className="w-full mt-3 bg-success/15 hover:bg-success/25 border border-success/30 text-success font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        <PhoneCall size={16} />
                        Unirse a la llamada
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-warning/20 text-warning',
    CONFIRMED: 'bg-success/20 text-success',
    IN_PROGRESS: 'bg-primary/20 text-primary-light',
    COMPLETED: 'bg-neutral-800 text-neutral-400',
    CANCELLED_CLIENT: 'bg-danger/20 text-danger',
    NO_SHOW_PROFESSIONAL: 'bg-danger/20 text-danger',
  };
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmada',
    IN_PROGRESS: 'En curso',
    COMPLETED: 'Completada',
    CANCELLED_CLIENT: 'Cancelada',
    NO_SHOW_PROFESSIONAL: 'No show',
  };

  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${styles[status] || 'bg-neutral-800 text-neutral-400'}`}>
      {labels[status] || status}
    </span>
  );
}

function EmptyState({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="bg-surface rounded-2xl p-8 text-center">
      <Icon size={36} className="text-neutral-600 mx-auto mb-3" />
      <p className="text-neutral-400 font-medium">{title}</p>
      <p className="text-neutral-600 text-sm mt-1">{subtitle}</p>
    </div>
  );
}
