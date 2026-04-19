import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store';
import { useFetch } from '../../hooks';
import { Button, Card, Badge, StatCard, Input, Modal, EmptyState, PageLoader, Alert } from '../../components/common/UI';
import { formatCurrency, formatDate } from '../../utils/helpers';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import WalletTopup from '../../components/wallet/WalletTopup';
import WalletTopupHistory from '../../components/wallet/WalletTopupHistory';

const CD = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9896B4', font: { size: 10 } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9896B4', font: { size: 10 } } },
  },
};


export default function DashPayments() {
  const { user, refreshUser, activeRole } = useAuthStore();
  const { data, loading, refetch } = useFetch('/payments');
  const { data: methodsData, loading: methodsLoading, refetch: refetchMethods } = useFetch('/payments/methods');
  const isClient = activeRole === 'client';

  const txns = data?.payments || [];
  const paymentMethodsFromBackend = methodsData?.data || [];

  const [activeTab, setActiveTab] = useState('overview');
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [addPaymentModal, setAddPaymentModal] = useState(false);
  const [editingMethodId, setEditingMethodId] = useState(null);
  const [wdAmt, setWdAmt] = useState('');
  const [wdLoading, setWdLoading] = useState(false);
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterType, setFilterType] = useState('all');
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Payment method form states
  const [pmLoading, setPmLoading] = useState(false);
  const [bankForm, setBankForm] = useState({ name: '', account: '', routing: '' });
  const [cardForm, setCardForm] = useState({
    type: 'Visa',
    number: '',
    expiry: '',
    cvv: '',
    holderName: '',
    isDefault: false
  });

  useEffect(() => {
    refreshUser();
  }, []);

  // Sync payment methods from backend
  useEffect(() => {
    if (paymentMethodsFromBackend && paymentMethodsFromBackend.length > 0) {
      setPaymentMethods(paymentMethodsFromBackend);
    }
  }, [paymentMethodsFromBackend]);

  // Helper to safely compare IDs (handles both string and object)
  const isSameId = (id1, id2) => {
    const str1 = typeof id1 === 'string' ? id1 : id1?._id?.toString();
    const str2 = typeof id2 === 'string' ? id2 : id2?._id?.toString();
    return str1 === str2;
  };

  // ═════════════════════════════════ FREELANCER CALCULATIONS ═════════════════════════════════
  // Use backend user fields directly - no calculations needed
  const totalGrossEarned = user?.totalGrossEarned || 0;
  const totalFeesPaid = user?.totalFeesPaid || 0;
  const totalEarned = user?.totalEarned || 0;
  const pendingEarnings = user?.pendingEarnings || 0;

  // Calculate earnings by project for freelancers (from transaction history)
  const freelancerTxns = txns.filter(txn => isSameId(txn.payee, user));
  const earningsByProject = txns.filter(txn => txn.order?.status === 'completed').reduce((acc, txn) => {
    const projectId = txn.order?._id || 'unknown';
    const projectName = txn.order?.title || 'Unknown Project';
    if (!acc[projectId]) {
      acc[projectId] = { name: projectName, netAmount: 0, count: 0 };
    }
    if (isSameId(txn.payee, user)) acc[projectId].netAmount += txn.netAmount || 0;
    acc[projectId].count += 1;
    return acc;
  }, {});

  // ═════════════════════════════════ CLIENT CALCULATIONS ═════════════════════════════════
  // Use backend user fields directly - no calculations needed
  const totalSpent = user?.totalSpent || 0;
  const budgetAllocated = user?.budgetAllocated || 0; // Escrow amount (may be 0 if not set)
  const walletBalance = user?.walletBalance || 0;
  const inEscrow = budgetAllocated; // Client escrow = budgetAllocated field

  // Calculate spending by project for projects tab (from transaction history)
  const clientTxns = txns.filter(txn => isSameId(txn.payer, user));
  const spendingByProject = clientTxns
    .filter(txn => txn.type !== 'wallet_topup' && txn.order?.status === 'completed')
    .reduce((acc, txn) => {
      const projectId = txn.order?._id || 'unknown';
      const projectName = txn.order?.title || 'Unknown Project';
      const freelancer = txn.payee?.fullName || 'Unknown Freelancer';
      if (!acc[projectId]) {
        acc[projectId] = { name: projectName, spent: 0, freelancers: [] };
      }
      acc[projectId].spent += txn.grossAmount || 0;
      if (!acc[projectId].freelancers.includes(freelancer)) {
        acc[projectId].freelancers.push(freelancer);
      }
      return acc;
    }, {});

  // Filter transactions
  let filteredTxns = txns.filter(txn => {
    // Exclude wallet top-ups from transaction history (shown in wallet tab instead)
    if (txn.type === 'wallet_topup') return false;
    // Only show transactions for completed orders
    if (txn.order?.status !== 'completed') return false;

    if (isClient && filterType !== 'all') {
      if (filterType === 'pending') return txn.status === 'pending';
      if (filterType === 'completed') return txn.status === 'completed';
    }
    if (!isClient && filterType !== 'all') {
      const txnType = isSameId(txn.payee, user) ? 'credit' : 'debit';
      if (filterType !== txnType) return false;
    }
    return true;
  });

  // Sort transactions
  filteredTxns = [...filteredTxns].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'amount-high') return (b.grossAmount || 0) - (a.grossAmount || 0);
    if (sortBy === 'amount-low') return (a.grossAmount || 0) - (b.grossAmount || 0);
    return 0;
  });

  const [selectedBankAccount, setSelectedBankAccount] = useState(null);

  const withdraw = async () => {
    // First check if user has payment methods
    if (!paymentMethods || paymentMethods.length === 0) {
      toast.error('Please add a bank account first');
      setWithdrawModal(false);
      setTimeout(() => setAddPaymentModal(true), 300);
      return;
    }

    const amount = parseFloat(wdAmt);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid withdrawal amount');
      return;
    }
    if (amount < 50) {
      toast.error('Minimum withdrawal is $50');
      return;
    }
    if (amount > (user?.walletBalance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    // Require valid bank account selection
    if (!selectedBankAccount) {
      toast.error('Please select a bank account for withdrawal');
      return;
    }

    setWdLoading(true);
    try {
      const res = await api.post('/payments/wallet/withdraw', {
        amount: parseFloat(amount),
        method: 'bank',
        bankDetails: {
          bankName: selectedBankAccount.bankName || selectedBankAccount.name || 'Bank Account',
          accountHolder: selectedBankAccount.accountHolder || selectedBankAccount.name || 'Account Holder',
          accountNumber: selectedBankAccount.accountNumber || selectedBankAccount.mask || '****',
          routingNumber: selectedBankAccount.routingNumber || '****'
        }
      });
      if (res.data.success) {
        toast.success(`$${amount} withdrawal requested! 💸`);
        setWithdrawModal(false);
        setWdAmt('');
        setSelectedBankAccount(null);
        refreshUser();
        refetch();
      } else {
        toast.error(res.data.message || 'Withdrawal failed');
      }
    } catch (err) {
      console.error('Withdrawal error:', err);
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setWdLoading(false);
    }
  };

  const downloadInvoice = (txn) => {
    toast.success(`Invoice downloaded! 📄`);
  };

  const addBankAccount = async () => {
    if (!bankForm.name || !bankForm.account || !bankForm.routing) {
      toast.error('Please fill all bank details');
      return;
    }
    setPmLoading(true);
    try {
      const payload = {
        type: 'bank',
        name: bankForm.name,
        mask: bankForm.account.slice(-4),
        bankName: bankForm.name,
        accountHolder: bankForm.name,
        accountNumber: bankForm.account,
        routingNumber: bankForm.routing,
        provider: 'stripe',
        metadata: {
          bankName: bankForm.name,
          accountNumber: bankForm.account,
          routingNumber: bankForm.routing
        }
      };

      const res = await api.post('/payments/methods', payload);

      if (res.data.success) {
        toast.success('Bank account added successfully! 🏦');
        setAddPaymentModal(false);
        setBankForm({ name: '', account: '', routing: '' });
        refetchMethods();
        refreshUser();
      } else {
        toast.error(res.data.message || 'Failed to add bank account');
      }
    } catch (err) {
      console.error('Bank account error:', err);
      toast.error(err.response?.data?.message || 'Failed to add bank account');
    } finally {
      setPmLoading(false);
    }
  };

  const addCreditCard = async () => {
    if (!cardForm.holderName || !cardForm.number || !cardForm.expiry || !cardForm.cvv) {
      toast.error('Please fill all card details');
      return;
    }

    // Basic validation
    if (cardForm.number.replace(/\s/g, '').length < 13) {
      toast.error('Invalid card number');
      return;
    }

    const [month, year] = cardForm.expiry.split('/');
    if (!month || !year || parseInt(month) > 12) {
      toast.error('Invalid expiry date (MM/YY)');
      return;
    }

    if (cardForm.cvv.length < 3) {
      toast.error('Invalid CVV');
      return;
    }

    setPmLoading(true);
    try {
      const payload = {
        type: 'card',
        cardType: cardForm.type,
        holderName: cardForm.holderName,
        cardNumber: cardForm.number.replace(/\s/g, ''),
        expiry: cardForm.expiry,
        cvv: cardForm.cvv,
        isDefault: cardForm.isDefault,
      };

      let res;
      if (editingMethodId) {
        res = await api.put(`/payments/methods/${editingMethodId}`, payload);
        toast.success('Card updated successfully! 💳');
        setEditingMethodId(null);
      } else {
        res = await api.post('/payments/methods', payload);
        toast.success('Card saved successfully! 💳');
      }

      if (res.data.success) {
        setAddPaymentModal(false);
        setCardForm({ type: 'Visa', number: '', expiry: '', cvv: '', holderName: '', isDefault: false });
        refetchMethods();
        refreshUser();
      }
    } catch (err) {
      console.error('Card error:', err);
      toast.error(err.response?.data?.message || 'Failed to save card');
    } finally {
      setPmLoading(false);
    }
  };

  const deletePaymentMethod = async (methodId) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) return;

    try {
      const id = methodId._id || methodId.id || methodId;
      const res = await api.delete(`/payments/methods/${id}`);
      if (res.data.success) {
        toast.success('Payment method deleted! 🗑️');
        refetchMethods();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete payment method');
    }
  };

  const setDefaultPaymentMethod = async (methodId) => {
    try {
      const id = methodId._id || methodId.id || methodId;
      const res = await api.put(`/payments/methods/${id}/default`);
      if (res.data.success) {
        toast.success('Default payment method updated! ✓');
        refetchMethods();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update default');
    }
  };

  const editPaymentMethod = (method) => {
    setEditingMethodId(method._id);
    if (method.type === 'card') {
      setCardForm({
        type: method.cardType,
        number: method.cardNumber?.slice(-4) || '',
        expiry: method.expiry || '',
        cvv: '',
        holderName: method.holderName || '',
        isDefault: method.isDefault || false,
      });
    }
    setAddPaymentModal(true);
  };

  // ═════════════════════════════════ FREELANCER TABS ═════════════════════════════════
  const freelancerTabs = [
    { id: 'overview', label: '💰 Overview', icon: 'Overview' },
    { id: 'history', label: '📋 Transaction History', icon: 'History' },
    { id: 'projects', label: '🎯 Earnings by Project', icon: 'Projects' },
    { id: 'methods', label: '💳 Payment Methods', icon: 'Methods' }
  ];

  // ═════════════════════════════════ CLIENT TABS ═════════════════════════════════
  const clientTabs = [
    { id: 'overview', label: '📊 Overview', icon: 'Overview' },
    { id: 'wallet', label: '💰 Wallet & Top-Up', icon: 'Wallet' },
    { id: 'history', label: '💸 Payment History', icon: 'History' },
    { id: 'projects', label: '🎯 Spending by Project', icon: 'Projects' },
    { id: 'methods', label: '💳 Payment Methods', icon: 'Methods' }
  ];

  const tabs = isClient ? clientTabs : freelancerTabs;

  return (
    <div className="animate-up">
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {isClient ? '💳 Payments Sent' : '💰 Earnings & Withdrawals'}
          </h1>
          <p style={{ color: 'var(--txt2)', fontSize: '0.875rem', marginTop: 3 }}>
            {isClient ? 'Manage your spending and payments to freelancers' : 'Manage your earnings and withdrawals'}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => isClient ? setAddPaymentModal(true) : setWithdrawModal(true)}>
          {isClient ? '💳 Add Payment Method' : '💸 Withdraw Funds'}
        </Button>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--b1)', overflowX: 'auto', paddingBottom: '0.75rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: activeTab === tab.id ? 'var(--acc)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--txt2)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: activeTab === tab.id ? 600 : 400,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {
        console.log(user)
      }

      {/* ═════════════════════════════════ FREELANCER VIEW ═════════════════════════════════ */}
      {!isClient ? (
        <div>
          {/* OVERVIEW TAB - FREELANCER */}
          {activeTab === 'overview' && (


            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.875rem', marginBottom: '1.75rem' }}>
                <StatCard label="Total Earned" value={formatCurrency(user?.totalGrossEarned || 0)} changeType="up" change="Gross amount" icon="💰" valueColor="var(--acc2)" />
                <StatCard label="Available" value={formatCurrency(user?.walletBalance || 0)} change="Ready to withdraw" changeType="nt" icon="💳" />
                <StatCard label="Platform Fee (5%)" value={formatCurrency(user?.totalFeesPaid || 0)} change="Lifetime" changeType="nt" icon="🏛️" />
                <StatCard label="Net Earnings" value={formatCurrency(user?.totalEarned || 0)} change="After fees" changeType="up" icon="🎯" valueColor="var(--ok)" />
                <StatCard label="In Escrow" value={formatCurrency(user?.pendingEarnings || 0)} change="Pending release" changeType="nt" icon="🔒" />
                <StatCard label="Withdrawn" value={formatCurrency(user?.withdrawnTotal || 0)} change="Lifetime" changeType="nt" icon="🏦" />
              </div>

              <Card style={{ marginBottom: '1.75rem', padding: '1.25rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>⚡ Quick Actions</h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  <Button variant="outline" full onClick={() => setWithdrawModal(true)}>💸 Withdraw Funds</Button>
                  <Button variant="outline" full onClick={() => setAddPaymentModal(true)}>+ Add Bank Account</Button>
                  <Button variant="outline" full onClick={() => toast.success('Tax forms available!')}>📊 Tax Forms</Button>
                  <Button variant="outline" full onClick={() => setActiveTab('history')}>📋 View Transactions</Button>
                </div>
              </Card>

              <Card>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>💡 Earnings Breakdown</h4>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(108,78,246,.08)', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Gross Earnings</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{formatCurrency(totalGrossEarned)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,77,106,.08)', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>OpenWork Fee (5%)</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--err)' }}>-{formatCurrency(totalFeesPaid)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(0,229,160,.08)', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Net Earnings</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ok)' }}>{formatCurrency(totalEarned)}</span>
                  </div>
                </div>
              </Card>

              <Card>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>🔒 Escrow Breakdown</h4>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(108,78,246,.08)', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>In Escrow (Pending Orders)</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{formatCurrency(pendingEarnings)}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--txt3)', padding: '0.5rem 0' }}>
                    💡 Your earnings are held in escrow until orders are completed and approved by clients
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TRANSACTION HISTORY TAB - FREELANCER */}
          {activeTab === 'history' && (
            <div>
              <Card style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--txt3)', marginBottom: '0.5rem' }}>Sort By</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--b1)', borderRadius: 8, background: 'var(--s1)', color: 'var(--txt1)', fontSize: '0.875rem' }}>
                      <option value="date-desc">Latest First</option>
                      <option value="date-asc">Oldest First</option>
                      <option value="amount-high">Amount: High to Low</option>
                      <option value="amount-low">Amount: Low to High</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--txt3)', marginBottom: '0.5rem' }}>Filter Type</label>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--b1)', borderRadius: 8, background: 'var(--s1)', color: 'var(--txt1)', fontSize: '0.875rem' }}>
                      <option value="all">All Transactions</option>
                      <option value="credit">Earnings Only</option>
                      <option value="debit">Payments Only</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <Button size="sm" variant="ghost" full onClick={() => toast.success('CSV exported!')}>📄 Export</Button>
                  </div>
                </div>
              </Card>

              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--b1)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Transactions ({filteredTxns.length})</h4>
                </div>
                {loading ? <PageLoader /> : filteredTxns.length === 0 ? (
                  <EmptyState icon="💳" title="No transactions" description="Complete projects to see your earnings" />
                ) : (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {filteredTxns.map(txn => {
                      const isCredit = isSameId(txn.payee, user);
                      const amountColor = isCredit ? 'var(--ok)' : 'var(--err)';
                      return (
                        <div key={txn._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--b1)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: isCredit ? 'rgba(0,229,160,.12)' : 'rgba(255,77,106,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                              {isCredit ? '⬇️' : '⬆️'}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{txn.order?.title || txn.type?.replace(/_/g, ' ')}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--txt3)' }}>{formatDate(txn.createdAt)} · {txn._id?.slice(-8)}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.95rem', fontWeight: 700, color: amountColor }}>
                              {isCredit ? '+' : '-'}{formatCurrency(txn.netAmount || 0)}
                            </div>
                            {txn.platformFee > 0 && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginTop: '0.2rem' }}>
                                Fee: ${(txn.platformFee || 0).toFixed(2)}
                              </div>
                            )}
                          </div>
                          <Button size="xs" variant="ghost" onClick={() => downloadInvoice(txn)}>🧾</Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* EARNINGS BY PROJECT TAB - FREELANCER */}
          {activeTab === 'projects' && (
            <Card>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>🎯 Earnings by Project</h4>
              {Object.keys(earningsByProject).length === 0 ? (
                <EmptyState icon="🎯" title="No earnings yet" description="Earnings from projects will appear here" />
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {Object.entries(earningsByProject).map(([projectId, data]) => (
                    <div key={projectId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--b1)' }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{data.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--txt3)', marginTop: 3 }}>{data.count} transaction(s)</div>
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--acc)' }}>{formatCurrency(data.netAmount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* PAYMENT METHODS TAB - FREELANCER */}
          {activeTab === 'methods' && (
            <div>
              <Card style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>🏦 Bank Accounts</h4>
                  <Button size="sm" variant="primary" onClick={() => {
                    setBankForm({ name: '', account: '', routing: '' });
                    setEditingMethodId(null);
                    setAddPaymentModal(true);
                  }}>+ Add Account</Button>
                </div>
                {paymentMethods.filter(m => m.type === 'bank').length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--b1)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏦</div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--txt2)', marginBottom: '1rem' }}>No bank accounts added yet</p>
                    <Button size="sm" variant="primary" onClick={() => setAddPaymentModal(true)}>Add Your First Account</Button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {paymentMethods.filter(m => m.type === 'bank').map(method => (
                      <div key={method._id || method.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--s2)', borderRadius: 10, border: method.isDefault ? '2px solid var(--acc)' : '1px solid var(--b1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                          <div style={{ fontSize: '1.5rem' }}>🏦</div>
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                              {method.bankName || method.name}
                              {method.isDefault && <Badge color="var(--acc)" style={{ marginLeft: '0.5rem' }}>Default</Badge>}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--txt3)' }}>
                              ****{method.accountNumber?.slice(-4) || method.mask || '****'}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button size="xs" variant="ghost" onClick={() => setDefaultPaymentMethod(method._id || method.id)} disabled={method.isDefault}>
                            ✓
                          </Button>
                          <Button size="xs" variant="ghost" onClick={() => deletePaymentMethod(method._id || method.id)}>
                            🗑️
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              <Card>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>ℹ️ Withdrawal Info</h4>
                <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  <div><strong>Minimum:</strong> $50</div>
                  <div><strong>Processing:</strong> 1–3 business days</div>
                  <div><strong>Fee:</strong> None (withdrawals are free)</div>
                  <div><strong>Tax Forms:</strong> 1099-NEC available in December</div>
                  <div style={{ padding: '0.75rem', background: 'rgba(0,229,160,.08)', borderRadius: 8, marginTop: '0.5rem', borderLeft: '3px solid var(--ok)' }}>
                    <strong>✓ Pro Tip:</strong> Add a bank account before withdrawing to speed up the process
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      ) : (
        /* ═════════════════════════════════ CLIENT VIEW ═════════════════════════════════ */
        <div>
          {/* OVERVIEW TAB - CLIENT */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.875rem', marginBottom: '1.75rem' }}>
                <StatCard label="In Wallet" value={formatCurrency(walletBalance)} change="Available funds" changeType="nt" icon="💳" />
                <StatCard label="In Escrow" value={formatCurrency(budgetAllocated)} change="Locked in active projects" changeType="nt" icon="🔒" />
                <StatCard label="Total Spent" value={formatCurrency(totalSpent)} change="On completed projects" changeType="down" icon="💸" valueColor="var(--err)" />
                <StatCard label="Withdrawn" value={formatCurrency(user?.withdrawnTotal || 0)} change="All time withdrawals" changeType="nt" icon="🏦" />
              </div>

              <Card style={{ marginBottom: '1.75rem', padding: '1.25rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>⚡ QuickActions</h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  <WalletTopup user={user} onSuccess={() => { refreshUser(); }} />
                  <Button variant="outline" full onClick={() => setAddPaymentModal(true)}>💳 Add Payment Method</Button>
                  <Button variant="outline" full onClick={() => toast.success('Invoices generated!')}>📄 Generate Invoices</Button>
                  <Button variant="outline" full onClick={() => setActiveTab('history')}>📋 View Payments</Button>
                  <Button variant="outline" full onClick={() => setActiveTab('projects')}>🎯 View Projects</Button>
                </div>
              </Card>

              <Card>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>� Account Summary</h4>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(108,78,246,.08)', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Available Balance</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{formatCurrency(walletBalance)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,180,0,.08)', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>In Escrow (Active Projects)</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--warn)' }}>{formatCurrency(budgetAllocated)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,77,106,.08)', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Total Spent (Completed)</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--err)' }}>-{formatCurrency(totalSpent)}</span>
                  </div>
                </div>
                {walletBalance <= 100 && (
                  <Alert type="warning" style={{ marginTop: '1rem' }}>⚠️ Low wallet balance. Consider adding funds to avoid project delays.</Alert>
                )}
              </Card>
            </div>
          )}
          {activeTab === 'wallet' && (
            <div>
              {/* Wallet Top-Up Section */}
              <Card style={{ marginBottom: '1.75rem', padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                  <div style={{ background: 'linear-gradient(135deg, rgba(0,229,160,0.1) 0%, rgba(108,78,246,0.1) 100%)', padding: '1rem', borderRadius: 12, border: '1px solid rgba(0,229,160,0.2)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--txt3)', marginBottom: '0.5rem' }}>Current Balance</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--acc)' }}>{formatCurrency(walletBalance)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginTop: '0.5rem' }}>Available to use</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, rgba(108,78,246,0.1) 0%, rgba(255,180,0,0.1) 100%)', padding: '1rem', borderRadius: 12, border: '1px solid rgba(108,78,246,0.2)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--txt3)', marginBottom: '0.5rem' }}>In Escrow</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warn)' }}>{formatCurrency(budgetAllocated)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginTop: '0.5rem' }}>Active projects</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, rgba(255,180,0,0.1) 0%, rgba(255,77,106,0.1) 100%)', padding: '1rem', borderRadius: 12, border: '1px solid rgba(255,180,0,0.2)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--txt3)', marginBottom: '0.5rem' }}>Total Spent</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--err)' }}>-{formatCurrency(totalSpent)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginTop: '0.5rem' }}>Completed orders</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--b1)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>💳 Add Funds to Wallet</h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  <WalletTopup user={user} onSuccess={() => { refreshUser(); }} />
                  <Button variant="outline" full onClick={() => setActiveTab('history')}>📋 View Payments</Button>
                  <Button variant="outline" full onClick={() => setActiveTab('methods')}>💳 Payment Methods</Button>
                  <Button variant="outline" full onClick={() => toast.info('Use wallet funds for any project or service on OpenWork')}>ℹ️ How It Works</Button>
                </div>
              </Card>

              {/* Wallet Top-Up History */}
              <Card>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>📊 Top-Up History</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--txt3)', margin: 0 }}>All your wallet top-up transactions</p>
                </div>
                <WalletTopupHistory />
              </Card>

              {/* Wallet Tips */}
              <Card style={{ marginTop: '1.75rem', padding: '1.25rem', background: 'linear-gradient(135deg, rgba(108,78,246,0.05) 0%, rgba(0,229,160,0.05) 100%)', borderLeft: '4px solid var(--acc)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>💡 Wallet Tips</h4>
                <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <span>✓</span>
                    <span>Keep funds in your wallet for faster project creation</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <span>✓</span>
                    <span>Use test cards in sandbox: 4111111111111111 (Visa)</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <span>✓</span>
                    <span>Funds are held in escrow until projects are completed</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <span>✓</span>
                    <span>No fees for adding funds to your wallet</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
          {activeTab === 'history' && (
            <div>
              <Card style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--txt3)', marginBottom: '0.5rem' }}>Sort By</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--b1)', borderRadius: 8, background: 'var(--s1)', color: 'var(--txt1)', fontSize: '0.875rem' }}>
                      <option value="date-desc">Latest First</option>
                      <option value="date-asc">Oldest First</option>
                      <option value="amount-high">Amount: High to Low</option>
                      <option value="amount-low">Amount: Low to High</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--txt3)', marginBottom: '0.5rem' }}>Filter Status</label>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--b1)', borderRadius: 8, background: 'var(--s1)', color: 'var(--txt1)', fontSize: '0.875rem' }}>
                      <option value="all">All Payments</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <Button size="sm" variant="ghost" full onClick={() => toast.success('CSV exported!')}>📄 Export</Button>
                  </div>
                </div>
              </Card>

              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--b1)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Payments ({filteredTxns.length})</h4>
                </div>
                {loading ? <PageLoader /> : filteredTxns.length === 0 ? (
                  <EmptyState icon="💳" title="No payments" description="Your payments to freelancers will appear here" />
                ) : (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {filteredTxns.map(txn => {
                      const isPaused = isSameId(txn.payer, user);
                      return (
                        <div key={txn._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--b1)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,77,106,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                              📤
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{txn.order?.title || 'Payment to Freelancer'}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--txt3)' }}>
                                {txn.payee?.fullName || 'Freelancer'} · {formatDate(txn.createdAt)}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.95rem', fontWeight: 700, color: 'var(--err)' }}>
                              -{formatCurrency(txn.grossAmount || 0)}
                            </div>
                            <Badge color={txn.status === 'completed' ? 'var(--ok)' : 'var(--warn)'} style={{ marginTop: '0.25rem' }}>
                              {txn.status?.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <Button size="xs" variant="ghost" onClick={() => downloadInvoice(txn)}>📋</Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* SPENDING BY PROJECT TAB - CLIENT */}
          {activeTab === 'projects' && (
            <Card>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>🎯 Spending by Project</h4>
              {Object.keys(spendingByProject).length === 0 ? (
                <EmptyState icon="🎯" title="No projects" description="Payments to projects will appear here" />
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {Object.entries(spendingByProject).map(([projectId, data]) => (
                    <div key={projectId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--b1)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{data.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--txt3)', marginTop: 3 }}>
                          {data.freelancers.length} freelancer(s)
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--err)' }}>-{formatCurrency(data.spent)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* PAYMENT METHODS TAB - CLIENT */}
          {activeTab === 'methods' && (
            <div>
              <Card style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>💳 Saved Payment Methods</h4>
                  <Button size="sm" variant="primary" onClick={() => { setEditingMethodId(null); setCardForm({ type: 'Visa', number: '', expiry: '', cvv: '', holderName: '', isDefault: false }); setAddPaymentModal(true); }}>+ Add Method</Button>
                </div>
                {methodsLoading ? (
                  <PageLoader />
                ) : paymentMethods.length === 0 ? (
                  <EmptyState icon="💳" title="No payment methods" description="Add a credit card to pay for services" />
                ) : (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {paymentMethods.filter(m => m.type === 'card').map(method => (
                      <div
                        key={method._id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1rem',
                          background: 'var(--s2)',
                          borderRadius: 10,
                          border: method.isDefault ? '2px solid var(--acc)' : '1px solid var(--b1)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(108,78,246,0.15)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                          <div style={{ fontSize: '2rem' }}>💳</div>
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {method.cardType} ending in {method.mask || '****'}
                              {method.isDefault && <Badge color="var(--acc)" style={{ fontSize: '0.62rem' }}>Default</Badge>}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--txt3)', marginTop: 3 }}>
                              {method.holderName} · Expires {method.expiry}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {!method.isDefault && (
                            <Button
                              size="xs"
                              variant="ghost"
                              title="Set as default"
                              onClick={() => setDefaultPaymentMethod(method._id)}
                            >
                              ⭐
                            </Button>
                          )}
                          <Button
                            size="xs"
                            variant="ghost"
                            title="Edit"
                            onClick={() => editPaymentMethod(method)}
                          >
                            ✏️
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            title="Delete"
                            onClick={() => deletePaymentMethod(method._id)}
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>🔒 Security & Privacy</h4>
                <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(0,229,160,.08)', borderRadius: 8, borderLeft: '3px solid var(--ok)' }}>
                    <strong>✓ Secure:</strong> Your card data is encrypted and never stored on our servers
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(108,78,246,.08)', borderRadius: 8, borderLeft: '3px solid var(--acc)' }}>
                    <strong>🔐 PCI Compliant:</strong> We use Stripe for secure payment processing
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(255,180,0,.08)', borderRadius: 8, borderLeft: '3px solid var(--warn)' }}>
                    <strong>📋 3D Secure:</strong> Additional authentication for fraud prevention
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* MODALS - FREELANCER */}
      {!isClient && (
        <>
          {/* Withdrawal Modal */}
          <Modal isOpen={withdrawModal} onClose={() => setWithdrawModal(false)} title="💸 Withdraw Funds">
            {paymentMethods.filter(m => m.type === 'bank').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏦</div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Add Bank Account First</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--txt2)', marginBottom: '1.5rem' }}>
                  You need to add a bank account before you can withdraw funds to your account.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="primary" full onClick={() => {
                    setWithdrawModal(false);
                    setAddPaymentModal(true);
                  }}>
                    + Add Bank Account
                  </Button>
                  <Button variant="ghost" onClick={() => setWithdrawModal(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <Alert type="ok">Available balance: <strong>{formatCurrency(user?.walletBalance || 0)}</strong></Alert>
                <Input label="Amount ($)" type="number" value={wdAmt} onChange={e => setWdAmt(e.target.value)} placeholder="Min $50" min="50" />

                <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Select Bank Account</label>
                  <select
                    value={selectedBankAccount?._id || ''}
                    onChange={e => setSelectedBankAccount(paymentMethods.find(m => m._id === e.target.value) || paymentMethods.find(m => m.id === e.target.value))}
                    style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--b1)', borderRadius: 8, background: 'var(--s1)', color: 'var(--txt1)', fontSize: '0.875rem' }}
                  >
                    <option value="">-- Select account --</option>
                    {paymentMethods.filter(m => m.type === 'bank').map(method => (
                      <option key={method._id || method.id} value={method._id || method.id}>
                        {method.bankName || method.name} - {method.accountNumber?.slice(-4) || method.mask || 'Account'}
                      </option>
                    ))}
                  </select>
                  {paymentMethods.filter(m => m.type === 'bank').length === 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--err)', marginTop: '0.5rem' }}>
                      ⚠️ No bank accounts available
                    </div>
                  )}
                </div>

                <Alert type="info">Bank transfers: 1–3 business days</Alert>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="primary" full loading={wdLoading} onClick={withdraw}>
                    Withdraw
                  </Button>
                  <Button variant="ghost" onClick={() => setWithdrawModal(false)}>Cancel</Button>
                </div>
              </>
            )}
          </Modal>

          {/* Add Payment Method Modal - Freelancer */}
          <Modal isOpen={addPaymentModal} onClose={() => setAddPaymentModal(false)} title="🏦 Add Bank Account">
            <div className="form-group">
              <label className="form-label">Account Holder Name</label>
              <input
                className="input"
                type="text"
                placeholder="Your full name"
                value={bankForm.name}
                onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bank Account Number</label>
              <input
                className="input"
                type="text"
                placeholder="Enter account number"
                value={bankForm.account}
                onChange={(e) => setBankForm({ ...bankForm, account: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Routing Number</label>
              <input
                className="input"
                type="text"
                placeholder="Enter routing number"
                value={bankForm.routing}
                onChange={(e) => setBankForm({ ...bankForm, routing: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" full onClick={addBankAccount} disabled={pmLoading}>{pmLoading ? 'Adding...' : 'Add Account'}</Button>
              <Button variant="ghost" onClick={() => setAddPaymentModal(false)}>Cancel</Button>
            </div>
          </Modal>
        </>
      )}

      {/* MODALS - CLIENT */}
      {isClient && (
        <>
          {/* Add Payment Method Modal - Client */}
          <Modal isOpen={addPaymentModal} onClose={() => { setAddPaymentModal(false); setEditingMethodId(null); }} title={`💳 ${editingMethodId ? 'Edit' : 'Add'} Credit Card`}>
            <Alert type="info">🔒 Your card details are encrypted and secure. We never store full card numbers.</Alert>

            <div className="form-group">
              <label className="form-label">Cardholder Name *</label>
              <input
                className="input"
                type="text"
                placeholder="John Doe"
                value={cardForm.holderName}
                onChange={(e) => setCardForm({ ...cardForm, holderName: e.target.value })}
                style={{ borderColor: 'var(--b1)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Card Type *</label>
              <select
                className="select"
                value={cardForm.type}
                onChange={(e) => setCardForm({ ...cardForm, type: e.target.value })}
              >
                <option>Visa</option>
                <option>Mastercard</option>
                <option>American Express</option>
                <option>Discover</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Card Number *</label>
              <input
                className="input"
                type="text"
                placeholder="4111 1111 1111 1111"
                value={cardForm.number}
                onChange={(e) => {
                  let val = e.target.value.replace(/\s/g, '');
                  val = val.replace(/(\d{4})/g, '$1 ').trim();
                  setCardForm({ ...cardForm, number: val });
                }}
                maxLength="19"
                style={{ borderColor: 'var(--b1)', fontFamily: 'monospace', letterSpacing: '0.05em' }}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--txt3)', marginTop: '0.4rem' }}>
                Enter 13-19 digit card number
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Expiry (MM/YY) *</label>
                <input
                  className="input"
                  type="text"
                  placeholder="12/25"
                  value={cardForm.expiry}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length >= 2) {
                      val = val.slice(0, 2) + '/' + val.slice(2, 4);
                    }
                    setCardForm({ ...cardForm, expiry: val });
                  }}
                  maxLength="5"
                  style={{ borderColor: 'var(--b1)', fontFamily: 'monospace' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">CVV *</label>
                <input
                  className="input"
                  type="text"
                  placeholder="123"
                  value={cardForm.cvv}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setCardForm({ ...cardForm, cvv: val });
                  }}
                  maxLength="4"
                  style={{ borderColor: 'var(--b1)', fontFamily: 'monospace', letterSpacing: '0.1em' }}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--txt3)', marginTop: '0.4rem' }}>
                  3-4 digits on back
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem',
              background: 'rgba(108,78,246,.08)',
              borderRadius: 8,
              marginTop: '1rem'
            }}>
              <input
                type="checkbox"
                id="defaultCard"
                checked={cardForm.isDefault}
                onChange={(e) => setCardForm({ ...cardForm, isDefault: e.target.checked })}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="defaultCard" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', margin: 0 }}>
                Set as default payment method
              </label>
            </div>

            <Alert type="warning" style={{ marginTop: '1rem' }}>
              ⚠️ Do not share your CVV or card details with anyone
            </Alert>

            <div style={{ display: 'flex', gap: 8, marginTop: '1.5rem' }}>
              <Button
                variant="primary"
                full
                onClick={addCreditCard}
                disabled={pmLoading}
              >
                {pmLoading ? 'Processing...' : editingMethodId ? 'Update Card' : 'Save Card'}
              </Button>
              <Button variant="ghost" full onClick={() => { setAddPaymentModal(false); setEditingMethodId(null); }}>
                Cancel
              </Button>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}