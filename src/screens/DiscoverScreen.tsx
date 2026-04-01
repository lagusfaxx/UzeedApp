import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Search, MapPin, RefreshCw, Users } from 'lucide-react';

interface DiscoverProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  availableNow: boolean;
  distanceKm: number | null;
  userLevel: string;
  serviceCategory: string | null;
}

export function DiscoverScreen() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ profiles: DiscoverProfile[] }>(
        '/profiles/discover?sort=featured&limit=20'
      );
      setProfiles(data.profiles || []);
    } catch {
      // Endpoint may not exist yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const filtered = useMemo(() => {
    if (!search.trim()) return profiles;
    const q = search.toLowerCase();
    return profiles.filter((p) =>
      p.displayName.toLowerCase().includes(q)
    );
  }, [profiles, search]);

  const handleCardClick = (id: string) => {
    navigate(`/profesional/${id}`);
  };

  return (
    <div className="safe-top">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-primary" />
          <h1 className="text-xl font-bold">Descubrir profesionales</h1>
        </div>
        <button
          onClick={fetchProfiles}
          className="text-neutral-400 p-2"
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Search bar */}
      <div className="px-5 mb-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface rounded-2xl p-8 text-center">
            <Users size={36} className="text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 font-medium">
              {search.trim()
                ? 'Sin resultados'
                : 'No hay profesionales disponibles'}
            </p>
            <p className="text-neutral-600 text-sm mt-1">
              {search.trim()
                ? 'Intenta con otro nombre'
                : 'Vuelve a intentarlo más tarde'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleCardClick(profile.id)}
                className="bg-surface rounded-2xl overflow-hidden text-left transition-colors hover:bg-surface-light group"
              >
                {/* Cover */}
                <div className="relative h-24 w-full">
                  {profile.coverUrl ? (
                    <img
                      src={profile.coverUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/40 to-primary/10" />
                  )}

                  {/* Available dot */}
                  {profile.availableNow && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-success rounded-full ring-2 ring-surface" />
                  )}
                </div>

                {/* Avatar overlapping cover */}
                <div className="px-3 -mt-5 relative">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border-2 border-surface"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-light border-2 border-surface flex items-center justify-center text-neutral-500">
                      <Users size={16} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="px-3 pt-1.5 pb-3">
                  <p className="font-semibold text-sm truncate">
                    {profile.displayName}
                  </p>

                  {profile.serviceCategory && (
                    <p className="text-xs text-primary mt-0.5 truncate">
                      {profile.serviceCategory}
                    </p>
                  )}

                  {profile.distanceKm !== null && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={10} className="text-neutral-500" />
                      <span className="text-[11px] text-neutral-500">
                        {profile.distanceKm < 1
                          ? '< 1 km'
                          : `${Math.round(profile.distanceKm)} km`}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
