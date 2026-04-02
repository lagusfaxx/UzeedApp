import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Heart, RefreshCw, Trash2, Star } from 'lucide-react';

interface FavoriteEntry {
  id: string;
  createdAt: string;
  professional: {
    id: string;
    name: string;
    avatarUrl: string | null;
    category: string;
    isActive: boolean;
    rating: number | null;
    userLevel: string;
  };
}

export function FavoritesScreen() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ favorites: FavoriteEntry[] }>('/favorites');
      setFavorites(data.favorites || []);
    } catch {
      // Endpoint may not be available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const removeFavorite = async (professionalId: string) => {
    try {
      await api.delete(`/favorites/${professionalId}`);
      setFavorites((prev) => prev.filter((f) => f.professional.id !== professionalId));
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
                  onClick={() => navigate(`/chat/${fav.professional.id}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  {fav.professional.avatarUrl ? (
                    <img src={fav.professional.avatarUrl} alt="" className="w-13 h-13 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-13 h-13 rounded-full bg-surface-light flex items-center justify-center text-lg font-bold text-neutral-500 shrink-0">
                      {fav.professional.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{fav.professional.name}</p>
                      {fav.professional.isActive && (
                        <span className="w-2 h-2 bg-success rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-primary mt-0.5 truncate">{fav.professional.category}</p>
                    {fav.professional.rating != null && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={10} className="text-warning fill-warning" />
                        <span className="text-[11px] text-neutral-400">{fav.professional.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-neutral-600 mt-0.5">
                      {fav.professional.userLevel}
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => removeFavorite(fav.professional.id)}
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
