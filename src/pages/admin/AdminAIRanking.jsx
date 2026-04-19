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

export default function AdminAIRanking() {
  const [weights, setWeights] = useState({ aiScore: 40, rating: 30, completion: 20, response: 10 });
  const [topFL, setTopFL] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch current weights from backend
    const fetchWeights = async () => {
      try {
        const { data } = await api.get('/admin/ai-ranking/weights');
        if (data.weights) {
          setWeights(data.weights);
        }
      } catch (err) {
        console.error('Failed to fetch AI weights:', err);
      }
    };

    fetchWeights();

    api.get('/users/freelancers', { params: { sort: 'ai', limit: 10 } })
      .then(({ data }) => setTopFL(data.freelancers || []));
  }, []);

  const handleSave = async () => {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    if (total !== 100) return toast.error(`Weights must sum to 100 (currently ${total})`);
    
    setSaving(true);
    try {
      await api.put('/admin/ai-ranking/weights', weights);
      toast.success('AI Ranking algorithm updated successfully ✅');
    } catch (error) {
      toast.error('Failed to save weights: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 700 }}>AI Ranking Management</h1>
          <p style={{ color: 'var(--txt2)', marginTop: '0.4rem' }}>Monitor and adjust freelancer ranking algorithm</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Apply Changes'}</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.85rem' }}>
          <h3 style={{ marginBottom: '1.6rem', fontSize: '1.05rem', fontWeight: 600 }}>Algorithm Parameters</h3>
          {Object.entries(weights).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--txt)' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                <span style={{ fontFamily: 'Space Mono, monospace', color: 'var(--acc)' }}>{value}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="70"
                value={value}
                onChange={e => setWeights(w => ({ ...w, [key]: +e.target.value }))}
                style={{ width: '100%', accentColor: 'var(--acc)' }}
              />
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '1.85rem' }}>
          <h3 style={{ marginBottom: '1.6rem', fontSize: '1.05rem', fontWeight: 600 }}>Algorithm Status</h3>
          {[['Accuracy Score', '94.2%', 'ok'], ['False Positive Rate', '2.1%', 'ok'], ['Bias Index', '0.03 (Excellent)', 'ok'], ['Freelancers Ranked', '34,219', 'neutral']].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--b1)', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--txt2)' }}>{label}</span>
              <span style={{ fontWeight: 600, color: 'var(--ok)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '1.85rem' }}>
        <h3 style={{ marginBottom: '1.6rem', fontSize: '1.05rem', fontWeight: 600 }}>🏆 Top Ranked Freelancers</h3>
        {topFL.map((fl, i) => (
          <div key={fl._id} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.1rem 0', borderBottom: '1px solid var(--b1)' }}>
            <div style={{ width: 28, textAlign: 'center', fontFamily: 'Space Mono, monospace', color: 'var(--txt3)' }}>#{i + 1}</div>
            <Avatar name={fl.fullName} size={42} radius={10} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{fl.fullName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--txt2)' }}>{fl.title}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, color: 'var(--acc)' }}>{fl.aiSkillScore}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--txt3)' }}>AI Score</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
