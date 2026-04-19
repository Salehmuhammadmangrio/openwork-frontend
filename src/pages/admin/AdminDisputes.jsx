import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

import { Button, Badge, Avatar, EmptyState, PageLoader } from '../../components/common/UI';
import { formatDate, formatCurrency, formatRelative } from '../../utils/helpers';
import { useAuthStore } from '../../store';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { adminStyles } from './adminStyles';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#9896B4', font: { size: 11 } } },
    y: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#9896B4', font: { size: 11 } } },
  },
};

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    api.get('/admin/disputes')
      .then(({ data }) => setDisputes(data.disputes || []))
      .catch(() => toast.error('Failed to load disputes'))
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async (type) => {
    if (!resolution.trim()) return toast.error('Please provide resolution details');
    setResolving(true);
    try {
      await api.put(`/admin/disputes/${selected._id}/resolve`, { status: `resolved_${type}`, resolution });
      toast.success('✅ Dispute resolved successfully');
      setDisputes(d => d.filter(x => x._id !== selected._id));
      setSelected(null);
      setResolution('');
    } catch { toast.error('Failed to resolve dispute'); }
    finally { setResolving(false); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ ...adminStyles.header, marginBottom: '2.5rem' }}>
        <div>
          <h1 style={adminStyles.headerTitle}>⚖️ Dispute Resolution</h1>
          <p style={adminStyles.headerSubtitle}>
            {disputes.length} open {disputes.length === 1 ? 'dispute' : 'disputes'} awaiting resolution
          </p>
        </div>
        <Badge style={{ fontSize: '0.9rem', fontWeight: 700, padding: '0.75rem 1.5rem' }}>
          🔴 {disputes.length} Open
        </Badge>
      </div>

      {loading ? <PageLoader /> : disputes.length === 0 ? (
        <div style={{ ...adminStyles.card, textAlign: 'center', padding: '3rem' }}>
          <EmptyState icon="✅" title="No active disputes" message="All disputes have been successfully resolved" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: '2rem', alignItems: 'start' }}>
          {/* Disputes List */}
          <div>
            {disputes.map((d, idx) => (
              <div
                key={d._id}
                style={{
                  ...adminStyles.card,
                  marginBottom: '1.5rem',
                  cursor: 'pointer',
                  border: selected?._id === d._id ? '2px solid var(--acc)' : '1px solid var(--b1)',
                  padding: '1.5rem',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => setSelected(d)}
                onMouseEnter={e => {
                  if (selected?._id !== d._id) {
                    e.currentTarget.style.borderColor = 'var(--acc)';
                    e.currentTarget.style.background = 'var(--s2)';
                  }
                }}
                onMouseLeave={e => {
                  if (selected?._id !== d._id) {
                    e.currentTarget.style.borderColor = 'var(--b1)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {/* Dispute Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.25rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--txt)' }}>
                      Order #{d.order?.title?.slice(0, 20)}
                    </h3>
                    <div style={{ fontSize: '0.9rem', color: 'var(--txt2)', fontWeight: 500 }}>
                      {d.reason?.replace(/_/g, ' ').toUpperCase()}
                    </div>
                  </div>
                  <Badge variant="warn" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                    {d.status || 'pending'}
                  </Badge>
                </div>

                {/* Description */}
                <p style={{ color: 'var(--txt2)', lineHeight: 1.6, marginBottom: '1.25rem', fontSize: '0.93rem' }}>
                  {d.description?.slice(0, 160)}{d.description?.length > 160 ? '...' : ''}
                </p>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ background: 'var(--s2)', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid var(--b1)' }}>
                    <div style={{ color: 'var(--txt3)', marginBottom: 2 }}>Amount</div>
                    <div style={{ fontWeight: 700, color: 'var(--txt)', fontSize: '0.95rem' }}>
                      {formatCurrency(d.order?.grossAmount)}
                    </div>
                  </div>
                  <div style={{ background: 'var(--s2)', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid var(--b1)' }}>
                    <div style={{ color: 'var(--txt3)', marginBottom: 2 }}>Raised</div>
                    <div style={{ fontWeight: 600, color: 'var(--txt)' }}>
                      {formatRelative(d.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Parties */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--txt3)' }}>
                  <span>👤 {d.raisedBy?.fullName?.split(' ')[0]}</span>
                  <span>→</span>
                  <span>👤 {d.against?.fullName?.split(' ')[0]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Resolution Panel */}
          {selected && (
            <div style={{ position: 'sticky', top: 100 }}>
              <div style={{
                ...adminStyles.card,
                padding: '1.75rem',
                background: 'var(--s1)',
                border: '1px solid var(--b1)'
              }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 700 }}>Resolve This Dispute</h3>

                {/* Selected Dispute Info */}
                <div style={{ background: 'var(--s2)', padding: '1.25rem', borderRadius: 12, marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid var(--b1)' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--txt2)' }}>Order:</span>
                    <strong style={{ color: 'var(--txt)', marginLeft: '0.5rem' }}>{selected.order?.title}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--txt2)' }}>Amount:</span>
                    <strong style={{ color: 'var(--acc)', marginLeft: '0.5rem' }}>{formatCurrency(selected.order?.grossAmount)}</strong>
                  </div>
                </div>

                {/* Resolution Textarea */}
                <textarea
                  className="textarea"
                  value={resolution}
                  onChange={e => setResolution(e.target.value)}
                  placeholder="📝 Write your resolution decision and detailed reasoning..."
                  style={{
                    width: '100%',
                    height: 130,
                    marginBottom: '1.5rem',
                    padding: '0.9rem 1.2rem',
                    borderRadius: 10,
                    border: '1px solid var(--b1)',
                    background: 'var(--bg)',
                    color: 'var(--txt)',
                    fontSize: '0.85rem',
                    resize: 'none'
                  }}
                />

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <Button
                    variant="primary"
                    full
                    loading={resolving}
                    onClick={() => handleResolve('freelancer')}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 4px 16px rgba(16,185,129,0.3)'
                    }}
                  >
                    ✅ Release to Freelancer
                  </Button>
                  <Button
                    variant="primary"
                    full
                    loading={resolving}
                    onClick={() => handleResolve('client')}
                    style={{
                      background: 'linear-gradient(135deg, var(--err) 0%, #dc2626 100%)',
                      boxShadow: '0 4px 16px rgba(255,77,106,0.3)'
                    }}
                  >
                    💳 Refund to Client
                  </Button>
                  <Button
                    variant="ghost"
                    full
                    style={{ marginTop: '0.5rem' }}
                    onClick={() => setSelected(null)}
                  >
                    ✕ Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}