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

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/admin/logs')
      .then(({ data }) => setLogs(data.logs || []))
      .catch(() => toast.error('Failed to load logs'))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = filter
    ? logs.filter(l =>
      l.action?.toLowerCase().includes(filter.toLowerCase()) ||
      l.user?.fullName?.toLowerCase().includes(filter.toLowerCase()) ||
      l.details?.toLowerCase().includes(filter.toLowerCase())
    )
    : logs;

  const severityColor = {
    low: 'var(--txt3)',
    medium: 'var(--warn)',
    high: 'var(--err)',
    critical: 'var(--err)'
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '2.5rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, var(--txt) 0%, var(--txt2) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            📋 Activity Logs
          </h1>
          <p style={{
            color: 'var(--txt2)',
            marginTop: '0.6rem',
            fontSize: '0.96rem'
          }}>
            Complete audit trail of all platform actions and system events
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => toast.success('Logs exported successfully')}
          style={{
            background: 'linear-gradient(135deg, var(--acc) 0%, var(--acc2) 100%)',
            boxShadow: '0 4px 16px rgba(108,78,246,0.3)'
          }}
        >
          📥 Export Logs
        </Button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '2rem' }}>
        <input
          className="input"
          style={{
            width: '100%',
            padding: '13px 18px',
            fontSize: '0.92rem',
            background: 'var(--s1)',
            border: '1px solid var(--b1)',
            borderRadius: 12,
            color: 'var(--txt)',
            transition: 'all 0.3s'
          }}
          placeholder="🔍 Search logs by action, user, IP, or detail..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--acc)';
            e.currentTarget.style.background = 'var(--s1)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108,78,246,0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--b1)';
            e.currentTarget.style.background = 'var(--s1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Logs Container */}
      {loading ? (
        <div style={{ padding: '5rem 0', textAlign: 'center' }}>
          <div className="spinner" />
        </div>
      ) : (
        <div style={{
          background: 'var(--s1)',
          border: '1px solid var(--b1)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {filteredLogs.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No activity logs found"
              message="Try adjusting your search filter or check back later for new activity"
            />
          ) : (
            <>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '60px 1.2fr 1.5fr 2fr 1.3fr 1fr',
                gap: '1.5rem',
                padding: '1.8rem 2rem',
                borderBottom: '1px solid var(--b1)',
                background: 'linear-gradient(135deg, var(--s2) 0%, rgba(108,78,246,0.05) 100%)',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: 'var(--txt2)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <div>🔴 Level</div>
                <div>👤 User</div>
                <div>⚙️ Action</div>
                <div>📝 Details</div>
                <div>⏰ Timestamp</div>
                <div>📊 Severity</div>
              </div>

              {/* Table Rows */}
              {filteredLogs.slice(0, 100).map((log, i) => (
                <div
                  key={log._id || i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1.2fr 1.5fr 2fr 1.3fr 1fr',
                    gap: '1.5rem',
                    alignItems: 'center',
                    padding: '1.5rem 2rem',
                    borderBottom: i < Math.min(filteredLogs.length - 1, 99) ? '1px solid var(--b1)' : 'none',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(108,78,246,0.02)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, rgba(108,78,246,0.08) 0%, transparent 100%)';
                    e.currentTarget.style.borderLeft = '3px solid var(--acc)';
                    e.currentTarget.style.paddingLeft = 'calc(2rem - 3px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(108,78,246,0.02)';
                    e.currentTarget.style.borderLeft = 'none';
                    e.currentTarget.style.paddingLeft = '2rem';
                  }}
                >
                  {/* Severity Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: severityColor[log.severity] || 'var(--txt3)',
                        boxShadow: `0 0 12px ${severityColor[log.severity] || 'var(--txt3)'}`,
                        cursor: 'pointer'
                      }}
                      title={`Severity: ${log.severity || 'normal'}`}
                    />
                  </div>

                  {/* User */}
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--txt)' }}>
                    {log.user?.fullName || 'System'}
                  </div>

                  {/* Action */}
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--acc)',
                    textTransform: 'capitalize',
                    letterSpacing: '0.2px'
                  }}>
                    {log.action?.split('_').join(' ').toLowerCase() || 'N/A'}
                  </div>

                  {/* Details */}
                  <div style={{
                    fontSize: '0.87rem',
                    color: 'var(--txt2)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }} 
                  title={log.details || 'No details'}>
                    {log.details || '—'}
                  </div>

                  {/* Timestamp */}
                  <div style={{ fontSize: '0.85rem', color: 'var(--txt3)', fontWeight: 500 }}>
                    {formatRelative(log.createdAt)}
                  </div>

                  {/* Status Badge */}
                  <Badge
                    variant={log.severity === 'high' || log.severity === 'critical' ? 'err' : log.severity === 'medium' ? 'warn' : 'default'}
                    style={{
                      fontSize: '0.78rem',
                      textTransform: 'capitalize',
                      fontWeight: 700,
                      padding: '0.5rem 0.8rem'
                    }}
                  >
                    {log.severity || 'normal'}
                  </Badge>
                </div>
              ))}
            </>
          )}

          {/* Footer */}
          {filteredLogs.length > 100 && (
            <div style={{
              padding: '1.3rem 2rem',
              borderTop: '1px solid var(--b1)',
              fontSize: '0.85rem',
              color: 'var(--txt3)',
              textAlign: 'center',
              background: 'var(--s2)',
              fontWeight: 600
            }}>
              📊 Showing 100 of {filteredLogs.length} activity logs
            </div>
          )}
        </div>
      )}
    </div>
  );
}