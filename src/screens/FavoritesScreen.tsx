import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Heart, MapPin, Users, RefreshCw, Trash2 } from 'lucide-react';

interface FavoriteProfessional {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  city: string | null;
  serviceCategory: string | null;
  isOnline: boolean;
  profileViews: number;
  completedServices: number;
}

export function FavoritesScreen() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteProfessional[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ favorites: FavoriteProfessional[] }>('/favorites');
      setFavorites(data.favorites || []);
    } catch {
      // Endpoint may return different shape
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const removeFavorite = async (id: string) => {
    try {
      await api.delete(`/favorites/${id}`);
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    } catch {
      // Ignore
    }
  };

  return (
    <div className="safe-top">
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart size={20} className="text-danger" />
          <h1 className="text-xl font-bold">Favoritos</h1>
        </div>
        <button onClick={fetchFavorites} className="text-neutral-400 p-2" disabled={loading}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="px-5 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-surface rounded-2xl p-8 text-center">
            <Heart size={36} className="text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 font-medium">Sin favoritos aún</p>
            <p className="text-neutral-600 text-sm mt-1">
              Guarda profesionales para acceder rápido a ellos
            </p>
            <button
              onClick={() => navigate('/explorar')}
              className="mt-4 text-primary text-sm font-semibold"
            >
              Explorar profesionales
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="bg-surface rounded-2xl p-4 flex items-center gap-3"
              >
                <button
                  onClick={() => navigate(`/profesional/${fav.username}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  {fav.avatarUrl ? (
                    <img src={fav.avatarUrl} alt="" className="w-13 h-13 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-13 h-13 rounded-full bg-surface-light flex items-center justify-center text-lg font-bold text-neutral-500 shrink-0">
                      {fav.displayName?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{fav.displayName}</p>
                      {fav.isOnline && (
                        <span className="w-2 h-2 bg-success rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 truncate">@{fav.username}</p>
                    {fav.serviceCategory && (
                      <p className="text-xs text-primary mt-0.5 truncate">{fav.serviceCategory}</p>
                    )}
                    {fav.city && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-neutral-600" />
                        <span className="text-[11px] text-neutral-600">{fav.city}</span>
                      </div>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => removeFavorite(fav.id)}
                  className="p-2 text-neutral-500 hover:text-danger transition-colors shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
