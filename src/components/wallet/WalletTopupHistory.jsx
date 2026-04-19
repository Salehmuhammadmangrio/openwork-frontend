import { useState, useEffect } from 'react';
import { useFetch } from '../../hooks';
import { Card, Badge, PageLoader, EmptyState, Pagination } from '../../components/common/UI';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function WalletTopupHistory() {
  const [page, setPage] = useState(1);
  const { data, loading } = useFetch(`/payments/wallet/topup-history?page=${page}&limit=10`);

  const topups = data?.data || [];
  const pagination = data?.pagination;

  const getStatusColor = (status) => {
    switch (status) {
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'released':
        return '✅';
      case 'pending':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Top-up History</h3>
        <span className="text-sm text-gray-600">
          {pagination?.totalItems || 0} transactions
        </span>
      </div>

      {topups.length === 0 ? (
        <EmptyState
          icon="💳"
          title="No Top-ups Yet"
          description="Add funds to your wallet to get started"
        />
      ) : (
        <>
          <div className="space-y-3">
            {topups.map((topup) => (
              <Card key={topup._id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">💰</div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {topup.description || 'Wallet Top-up'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(topup.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      +{formatCurrency(topup.grossAmount)}
                    </p>
                    <Badge className={getStatusColor(topup.status)}>
                      {getStatusIcon(topup.status)} {topup.status.charAt(0).toUpperCase() + topup.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Metadata if available */}
                {topup.metadata?.payfastPaymentId && (
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    <p>Transaction ID: {topup.metadata.payfastPaymentId}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
