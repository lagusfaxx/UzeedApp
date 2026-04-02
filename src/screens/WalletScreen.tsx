import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { WalletData, TokenTransaction } from '@/lib/types';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Clock, TrendingUp,
  TrendingDown, RefreshCw, Receipt, CreditCard, Plus
} from 'lucide-react';

export function WalletScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPro = user?.profileType === 'PROFESSIONAL';
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'transactions' | 'deposits' | 'withdrawals'>('transactions');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [walletRes, txRes, depRes, wdRes] = await Promise.all([
        api.get<WalletData>('/wallet'),
        api.get<{ transactions: TokenTransaction[] }>('/wallet/transactions'),
        api.get<{ deposits: any[] }>('/wallet/deposits').catch(() => ({ deposits: [] })),
        isPro ? api.get<{ withdrawals: any[] }>('/wallet/withdrawals').catch(() => ({ withdrawals: [] })) : Promise.resolve({ withdrawals: [] }),
      ]);
      setWallet(walletRes);
      setTransactions(txRes.transactions);
      setDeposits(depRes.deposits);
      setWithdrawals(wdRes.withdrawals);
    } finally {
      setLoading(false);
    }
  }, [isPro]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const formatCLP = (tokens: number, rate: number) =>
    `$${(tokens * rate).toLocaleString('es-CL')} CLP`;

  return (
    <div className="safe-top">
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">Billetera</h1>
        <button onClick={fetchData} className="text-neutral-400 p-2" disabled={loading}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="px-5 space-y-4 pb-6">
        {/* Balance card */}
        <div className="bg-gradient-to-br from-primary/20 to-violet-600/5 border border-primary/15 rounded-2xl p-5">
          <p className="text-neutral-400 text-[10px] font-semibold uppercase tracking-widest">Saldo disponible</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-4xl font-bold">{wallet?.balance ?? '—'}</span>
            <span className="text-neutral-400 text-base">tokens</span>
          </div>
          {wallet && (
            <p className="text-neutral-500 text-sm mt-1">
              {formatCLP(wallet.balance, wallet.tokenRateClp)}
            </p>
          )}
          {wallet && wallet.heldBalance > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
              <Clock size={14} className="text-warning" />
              <span className="text-sm text-warning">{wallet.heldBalance} tokens retenidos</span>
            </div>
          )}
        </div>

        {/* Buy tokens button (clients) / Withdraw button (pros) */}
        {!isPro && (
          <button
            onClick={() => navigate('/comprar-tokens')}
            className="w-full bg-gradient-to-r from-primary to-violet-500 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            Comprar tokens
          </button>
        )}

        {/* Stats */}
        {wallet && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface rounded-xl p-4">
              <TrendingUp size={16} className="text-success mb-2" />
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                {isPro ? 'Total ganado' : 'Total comprado'}
              </p>
              <p className="text-sm font-bold mt-0.5">{wallet.totalEarned} tokens</p>
            </div>
            <div className="bg-surface rounded-xl p-4">
              <TrendingDown size={16} className="text-neutral-400 mb-2" />
              <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Total gastado</p>
              <p className="text-sm font-bold mt-0.5">{wallet.totalSpent} tokens</p>
            </div>
          </div>
        )}

        {/* Section tabs */}
        <div className="flex bg-surface rounded-xl p-1 gap-1">
          <TabBtn active={activeSection === 'transactions'} onClick={() => setActiveSection('transactions')} label="Movimientos" />
          <TabBtn active={activeSection === 'deposits'} onClick={() => setActiveSection('deposits')} label="Depósitos" />
          {isPro && <TabBtn active={activeSection === 'withdrawals'} onClick={() => setActiveSection('withdrawals')} label="Retiros" />}
        </div>

        {/* Transactions list */}
        {activeSection === 'transactions' && (
          transactions.length === 0 && !loading ? (
            <Empty icon={Wallet} text="Sin movimientos aún" />
          ) : (
            <div className="bg-surface rounded-2xl divide-y divide-border">
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )
        )}

        {/* Deposits list */}
        {activeSection === 'deposits' && (
          deposits.length === 0 && !loading ? (
            <Empty icon={CreditCard} text="Sin depósitos aún" />
          ) : (
            <div className="bg-surface rounded-2xl divide-y divide-border">
              {deposits.map((dep: any) => (
                <div key={dep.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <CreditCard size={14} className="text-primary-light" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{dep.amount} tokens</p>
                    <p className="text-[11px] text-neutral-500">
                      {dep.method === 'FLOW' ? 'Flow.cl' : 'Transferencia'} · ${dep.clpAmount?.toLocaleString('es-CL')} CLP
                    </p>
                  </div>
                  <StatusPill status={dep.status} />
                </div>
              ))}
            </div>
          )
        )}

        {/* Withdrawals list */}
        {activeSection === 'withdrawals' && (
          withdrawals.length === 0 && !loading ? (
            <Empty icon={Receipt} text="Sin retiros aún" />
          ) : (
            <div className="bg-surface rounded-2xl divide-y divide-border">
              {withdrawals.map((wd: any) => (
                <div key={wd.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-8 h-8 rounded-full bg-warning/15 flex items-center justify-center shrink-0">
                    <Receipt size={14} className="text-warning" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{wd.amount} tokens</p>
                    <p className="text-[11px] text-neutral-500">
                      {wd.bankName} · {wd.accountType}
                    </p>
                  </div>
                  <StatusPill status={wd.status} />
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
        active ? 'bg-surface-light text-white' : 'text-neutral-500'
      }`}
    >
      {label}
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-warning/15 text-warning',
    APPROVED: 'bg-success/15 text-success',
    REJECTED: 'bg-danger/15 text-danger',
  };
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobado',
    REJECTED: 'Rechazado',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${styles[status] || 'bg-neutral-800 text-neutral-400'}`}>
      {labels[status] || status}
    </span>
  );
}

function Empty({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="bg-surface rounded-2xl p-8 text-center">
      <Icon size={28} className="text-neutral-600 mx-auto mb-2" />
      <p className="text-neutral-500 text-sm">{text}</p>
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
    VIDEOCALL_REFUND: 'Reembolso',
    VIDEOCALL_COMMISSION: 'Comisión',
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
          <ArrowDownLeft size={14} className="text-success" />
        ) : (
          <ArrowUpRight size={14} className="text-neutral-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{typeLabels[tx.type] || tx.type}</p>
        {tx.description && (
          <p className="text-[11px] text-neutral-500 truncate">{tx.description}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${isPositive ? 'text-success' : 'text-white'}`}>
          {isPositive ? '+' : ''}{tx.amount}
        </p>
        <p className="text-[10px] text-neutral-500">
          {new Date(tx.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
        </p>
      </div>
    </div>
  );
}
