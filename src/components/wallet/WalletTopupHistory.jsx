import { useState } from 'react';
import { useFetch } from '../../hooks';
import { Badge, PageLoader, EmptyState } from '../../components/common/UI';
import { formatCompactCurrency, formatDate } from '../../utils/helpers';

export default function WalletTopupHistory() {
  const [page, setPage] = useState(1);
  const { data, loading } = useFetch(`/payments/wallet/topup-history?page=${page}&limit=10`);

  const topups = data?.data || [];
  const pagination = data?.pagination;

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'released':
        return { icon: '✅', label: 'Confirmed', color: 'var(--ok)', bgColor: 'rgba(0,229,160,0.15)' };
      case 'pending':
        return { icon: '❌', label: 'Failed', color: 'var(--err)', bgColor: 'rgba(255,77,106,0.15)' };
      case 'failed':
        return { icon: '❌', label: 'Failed', color: 'var(--err)', bgColor: 'rgba(255,77,106,0.15)' };
      default:
        return { icon: '❓', label: status, color: 'var(--txt3)', bgColor: 'rgba(152,151,180,0.15)' };
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--b1)' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>📊 Top-up Transactions</h4>
        <span style={{ fontSize: '0.75rem', color: 'var(--txt3)', fontWeight: 600, background: 'rgba(0,229,160,0.1)', padding: '0.4rem 0.75rem', borderRadius: 6 }}>
          {pagination?.totalItems || 0} transactions
        </span>
      </div>

      {topups.length === 0 ? (
        <EmptyState
          icon="💳"
          title="No Top-ups Yet"
          description="Your wallet top-up transactions will appear here"
        />
      ) : (
        <>
          {/* Transactions List */}
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {topups.map((topup) => {
              const statusDisplay = getStatusDisplay(topup.status);
              return (
              <div key={topup._id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                background: 'var(--s2)',
                borderRadius: 10,
                border: '1px solid var(--b1)',
                transition: 'all 0.2s ease',
                cursor: 'default'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--s1)';
                e.currentTarget.style.borderColor = statusDisplay.color;
                e.currentTarget.style.boxShadow = `0 4px 12px ${statusDisplay.color}20`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--s2)';
                e.currentTarget.style.borderColor = 'var(--b1)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                {/* Left: Icon + Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: statusDisplay.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0
                  }}>
                    💳
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--txt)' }}>
                      {topup.description || 'Wallet Top-up'}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--txt3)',
                      marginTop: '0.3rem',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      <span>📅 {formatDate(topup.createdAt)}</span>
                      {topup.metadata?.payfastPaymentId && (
                        <span>•  ID: {topup.metadata.payfastPaymentId.substring(0, 8)}...</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount + Status */}
                    <div style={{
                    textAlign: 'right',
                    marginLeft: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.4rem'
                  }}>
                    <div style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: topup.status === 'released' ? 'var(--ok)' : 'var(--err)'
                    }}>
                      {topup.status === 'released' ? '+' : ''}{formatCompactCurrency(topup.grossAmount)}
                    </div>
                    <Badge color={statusDisplay.color} style={{ fontSize: '0.65rem', padding: '0.3rem 0.65rem' }}>
                      {statusDisplay.icon} {statusDisplay.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--b1)' }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid var(--b1)',
                  borderRadius: 6,
                  background: page === 1 ? 'var(--s2)' : 'var(--s1)',
                  color: 'var(--txt)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                ← Previous
              </button>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--txt3)'
              }}>
                Page {page} of {pagination.totalPages}
              </div>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid var(--b1)',
                  borderRadius: 6,
                  background: page === pagination.totalPages ? 'var(--s2)' : 'var(--s1)',
                  color: 'var(--txt)',
                  cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === pagination.totalPages ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
