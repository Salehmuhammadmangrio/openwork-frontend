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

// ─── AdminLayout ──────────────────────────────────────────────
export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin', label: 'Overview', icon: '📊', end: true },
    { to: '/admin/users', label: 'Manage Users', icon: '👥' },
    { to: '/admin/jobs', label: 'Jobs & Offers', icon: '💼' },
    { to: '/admin/disputes', label: 'Disputes', icon: '⚖️' },
    { to: '/admin/ai-ranking', label: 'AI Ranking', icon: '🤖' },
    { to: '/admin/fraud', label: 'Fraud Detection', icon: '🛡️' },
    { to: '/admin/reports', label: 'Reports', icon: '📈' },
    { to: '/admin/logs', label: 'Activity Logs', icon: '📋' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: '100vh', background: 'var(--bg)', paddingTop: 64 }}>
      {/* Sidebar */}
      <aside style={{
        background: 'var(--s1)',
        borderRight: '1px solid var(--b1)',
        padding: '2rem 1.25rem',
        position: 'sticky',
        top: 64,
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Admin Badge */}
        <div style={{
          background: 'var(--s2)',
          border: '1px solid var(--b1)',
          borderRadius: 14,
          padding: '1.15rem 1.35rem',
          marginBottom: '2rem'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--err)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>👑 Admin Panel</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--txt)', marginTop: 6 }}>{user?.fullName}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--txt2)', marginTop: 3 }}>Super Admin Access</div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '0.95rem 1.15rem',
                marginBottom: '6px',
                borderRadius: 12,
                color: isActive ? 'var(--acc)' : 'var(--txt2)',
                background: isActive ? 'var(--s2)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.92rem',
                transition: 'all 0.2s ease',
                textDecoration: 'none',
                borderLeft: isActive ? '2px solid var(--acc)' : '2px solid transparent',
                paddingLeft: isActive ? '1.05rem' : '1.15rem',
                cursor: 'pointer'
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.style.background.includes('var(--s2)')) {
                  e.currentTarget.style.background = 'rgba(108,78,246,0.08)';
                  e.currentTarget.style.color = 'var(--txt)';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.style.background.includes('var(--s2)')) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--txt2)';
                }
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--b1)', margin: '1.75rem 0.5rem' }} />

        {/* Bottom Actions */}
        <div
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '0.95rem 1.15rem', borderRadius: 12,
            cursor: 'pointer', color: 'var(--txt2)', transition: 'all 0.2s',
            fontSize: '0.92rem'
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = 'rgba(108,78,246,0.1)';
            e.currentTarget.style.color = 'var(--txt)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--txt2)';
          }}
        >
          <span style={{ fontSize: '1.15rem' }}>↩️</span>
          <span>Back to Dashboard</span>
        </div>

        <div
          onClick={() => { logout(); navigate('/'); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '0.95rem 1.15rem', borderRadius: 12,
            cursor: 'pointer', color: 'var(--err)', marginTop: 6, transition: 'all 0.2s',
            fontSize: '0.92rem'
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = 'rgba(255,77,106,0.1)';
            e.currentTarget.style.color = 'var(--err)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--err)';
          }}
        >
          <span style={{ fontSize: '1.15rem' }}>🚪</span>
          <span>Sign Out</span>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ 
        padding: '2.5rem 3rem', 
        overflowY: 'auto', 
        background: 'var(--bg)'
      }}>
        <Outlet />
      </main>
    </div>
  );
}