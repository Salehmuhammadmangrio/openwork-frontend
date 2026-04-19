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

export default function AdminFraud() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, highSeverity: 0, mediumSeverity: 0 });

  useEffect(() => {
    api.get('/admin/fraud')
      .then(({ data }) => {
        setAlerts(data.alerts || []);
        setStats(data.stats || { total: 0, highSeverity: 0, mediumSeverity: 0 });
      })
      .catch(() => toast.error('Failed to load fraud alerts'))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (action, alertId) => {
    try {
      if (action === 'suspended') {
        await api.post(`/admin/fraud/${alertId}/suspend`, { reason: 'Fraud detected' });
        toast.success('User suspended successfully');
      } else {
        toast.success('Alert cleared');
      }
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch {
      toast.error('Action failed');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 700 }}>Fraud Detection</h1>
          <p style={{ color: 'var(--txt2)', marginTop: '0.4rem' }}>AI-flagged suspicious accounts and behaviors</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>🔄 Refresh</Button>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {[
              ['Active Alerts', stats.total, 'err'],
              ['High Severity', stats.highSeverity, 'err'],
              ['Medium Severity', stats.mediumSeverity, 'warn']
            ].map(([label, value, color]) => (
              <div key={label} className="card" style={{ padding: '1.75rem' }}>
                <div style={{ color: 'var(--txt2)', fontSize: '0.85rem' }}>{label}</div>
                <div style={{ fontSize: '2.1rem', fontWeight: 700, color: color === 'err' ? 'var(--err)' : color === 'warn' ? 'var(--warn)' : 'var(--ok)', marginTop: '0.5rem' }}>{value}</div>
              </div>
            ))}
          </div>

          {alerts.length === 0 ? (
            <EmptyState icon="✅" title="No fraud alerts" message="All systems clear" />
          ) : (
            alerts.map(a => (
              <div key={a.id} className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.4rem' }}>{a.severity === 'high' ? '🔴' : '🟡'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 600 }}>{a.user}</div>
                      <Badge variant="err">{a.type}</Badge>
                      <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--txt3)' }}>Confidence: {a.confidence}%</span>
                    </div>
                    <p style={{ color: 'var(--txt2)', lineHeight: 1.5 }}>{a.reason}</p>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--txt3)' }}>
                      {a.email} • {formatRelative(a.flaggedAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Button variant="danger" size="xs" onClick={() => handleAction('suspended', a.id)}>Suspend</Button>
                    <Button variant="ghost" size="xs" onClick={() => handleAction('cleared', a.id)}>Clear</Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}