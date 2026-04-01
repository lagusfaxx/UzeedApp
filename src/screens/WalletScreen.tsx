import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { WalletData, TokenTransaction } from '@/lib/types';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export function WalletScreen() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [walletRes, txRes] = await Promise.all([
        api.get<WalletData>('/wallet'),
        api.get<{ transactions: TokenTransaction[] }>('/wallet/transactions'),
      ]);
      setWallet(walletRes);
      setTransactions(txRes.transactions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatCLP = (tokens: number, rate: number) =>
    `$${(tokens * rate).toLocaleString('es-CL')} CLP`;

  return (
    <div className="safe-top">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">Billetera</h1>
        <button onClick={fetchData} className="text-neutral-400 p-2" disabled={loading}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="px-5 space-y-5 pb-6">
        {/* Balance card */}
        <div className="bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/20 rounded-2xl p-5">
          <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Saldo disponible</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-bold">{wallet?.balance ?? '—'}</span>
            <span className="text-neutral-400 text-lg">tokens</span>
          </div>
          {wallet && (
            <p className="text-neutral-400 text-sm mt-1">
              {formatCLP(wallet.balance, wallet.tokenRateClp)}
            </p>
          )}

          {wallet && wallet.heldBalance > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
              <Clock size={14} className="text-warning" />
              <span className="text-sm text-warning">
                {wallet.heldBalance} tokens retenidos
              </span>
            </div>
          )}
        </div>

        {/* Stats row */}
        {wallet && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={TrendingUp}
              label="Total ganado"
              value={`${wallet.totalEarned} tokens`}
              color="text-success"
            />
            <StatCard
              icon={TrendingDown}
              label="Total gastado"
              value={`${wallet.totalSpent} tokens`}
              color="text-neutral-400"
            />
          </div>
        )}

        {/* Transactions */}
        <div>
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Historial
          </h2>

          {transactions.length === 0 && !loading ? (
            <div className="bg-surface rounded-2xl p-8 text-center">
              <Wallet size={32} className="text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm">Sin transacciones aún</p>
            </div>
          ) : (
            <div className="bg-surface rounded-2xl divide-y divide-border">
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string; color: string;
}) {
  return (
    <div className="bg-surface rounded-xl p-4">
      <Icon size={18} className={`${color} mb-2`} />
      <p className="text-[11px] text-neutral-500">{label}</p>
      <p className="text-sm font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function TransactionRow({ tx }: { tx: TokenTransaction }) {
  const isPositive = tx.amount > 0;
  const typeLabels: Record<string, string> = {
    DEPOSIT: 'Depósito',
    WITHDRAWAL: 'Retiro',
    VIDEOCALL_HOLD: 'Videollamada (retención)',
    VIDEOCALL_RELEASE: 'Videollamada (pago)',
    VIDEOCALL_REFUND: 'Reembolso videollamada',
    VIDEOCALL_COMMISSION: 'Comisión plataforma',
    TIP: 'Propina',
    PRIVATE_SHOW: 'Show privado',
    PENALTY: 'Penalización',
    ADJUSTMENT: 'Ajuste',
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isPositive ? 'bg-success/15' : 'bg-neutral-800'
      }`}>
        {isPositive ? (
          <ArrowDownLeft size={16} className="text-success" />
        ) : (
          <ArrowUpRight size={16} className="text-neutral-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{typeLabels[tx.type] || tx.type}</p>
        {tx.description && (
          <p className="text-[11px] text-neutral-500 truncate">{tx.description}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${isPositive ? 'text-success' : 'text-white'}`}>
          {isPositive ? '+' : ''}{tx.amount}
        </p>
        <p className="text-[10px] text-neutral-500">
          {new Date(tx.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
        </p>
      </div>
    </div>
  );
}
