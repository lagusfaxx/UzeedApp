import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, CreditCard, ExternalLink, Check } from 'lucide-react';

interface TokenPackage {
  tokens: number;
  clpAmount: number;
  label: string;
}

interface PackagesResponse {
  packages: TokenPackage[];
  tokenRateClp: number;
}

interface DepositFlowResponse {
  url: string;
  token: string;
  intentId: string;
}

function formatCLP(amount: number): string {
  return `$${amount.toLocaleString('es-CL')}`;
}

export function BuyTokensScreen() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [tokenRate, setTokenRate] = useState<number>(0);
  const [selected, setSelected] = useState<TokenPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<PackagesResponse>('/wallet/packages');
        setPackages(data.packages);
        setTokenRate(data.tokenRateClp);
        if (data.packages.length > 0) {
          setSelected(data.packages[0]);
        }
      } catch {
        setError('No se pudieron cargar los paquetes. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handleBuy = async () => {
    if (!selected || buying) return;
    setBuying(true);
    setError(null);
    try {
      const res = await api.post<DepositFlowResponse>('/wallet/deposit/flow', {
        tokens: selected.tokens,
      });
      window.open(res.url, '_blank');
    } catch {
      setError('Error al procesar el pago. Intenta nuevamente.');
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 safe-top">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => navigate('/billetera')}
          className="text-neutral-400 p-2 -ml-2 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">Comprar Tokens</h1>
      </div>

      <div className="px-5 space-y-5 pb-8">
        {/* Token rate banner */}
        {!loading && tokenRate > 0 && (
          <div className="flex items-center gap-2.5 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3">
            <Coins size={18} className="text-primary shrink-0" />
            <span className="text-sm text-neutral-300">
              1 token = <span className="font-semibold text-white">{formatCLP(tokenRate)} CLP</span>
            </span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-neutral-500 text-sm">Cargando paquetes...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Package grid */}
        {!loading && packages.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {packages.map((pkg) => {
              const isSelected = selected?.tokens === pkg.tokens;
              return (
                <button
                  key={pkg.tokens}
                  onClick={() => setSelected(pkg)}
                  className={`relative bg-[#141414] rounded-2xl p-4 text-left transition-all duration-150 border-2 ${
                    isSelected
                      ? 'border-[#7c3aed] shadow-lg shadow-primary/10'
                      : 'border-[#262626] hover:border-neutral-600'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-[#7c3aed] rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                  {pkg.label && (
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full px-2 py-0.5 mb-2">
                      {pkg.label}
                    </span>
                  )}
                  <p className="text-2xl font-bold text-white">{pkg.tokens.toLocaleString('es-CL')}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">tokens</p>
                  <p className="text-sm font-medium text-neutral-300 mt-2">
                    {formatCLP(pkg.clpAmount)} CLP
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && packages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Coins size={32} className="text-neutral-600" />
            <p className="text-neutral-500 text-sm">No hay paquetes disponibles.</p>
          </div>
        )}

        {/* Buy button */}
        {!loading && selected && (
          <button
            onClick={handleBuy}
            disabled={buying}
            className="w-full bg-gradient-to-r from-[#7c3aed] to-violet-500 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-opacity disabled:opacity-50"
          >
            {buying ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard size={18} />
                Comprar {selected.tokens.toLocaleString('es-CL')} tokens
                <ExternalLink size={14} className="ml-1 opacity-60" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
