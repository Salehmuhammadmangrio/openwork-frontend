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

export default function AdminJobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        api.get('/admin/jobs', { params: { limit: 20 } })
            .then(({ data }) => setJobs(data.jobs || []))
            .catch(() => toast.error('Failed to load jobs'))
            .finally(() => setLoading(false));
    }, []);

    const handleRemoveJob = async (jobId, jobTitle) => {
        if (!window.confirm(`Remove job "${jobTitle}"? This action cannot be undone.`)) return;

        setDeleting(jobId);
        try {
            await api.delete(`/admin/jobs/${jobId}`, {
                data: { reason: 'Violates platform policies' }
            });
            toast.success('Job removed successfully ✅');
            setJobs(jobs.filter(j => j._id !== jobId));
        } catch (error) {
            toast.error('Failed to remove job: ' + error.message);
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2.25rem' }}>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 700 }}>Jobs & Offers Moderation</h1>
                <p style={{ color: 'var(--txt2)', marginTop: '0.4rem' }}>Review and moderate all platform listings</p>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '5rem', textAlign: 'center' }}><div className="spinner" /></div>
                ) : (
                    jobs.map((j, i) => (
                        <div key={j._id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.5rem',
                            padding: '1.25rem 1.85rem',
                            borderBottom: i < jobs.length - 1 ? '1px solid var(--b1)' : 'none',
                            transition: 'background 0.2s'
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--s2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{j.title}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--txt2)', marginTop: 4 }}>
                                    {j.client?.fullName} • {j.category} • {j.proposalCount || 0} proposals
                                </div>
                            </div>
                            <Badge variant={j.status === 'open' ? 'ok' : j.status === 'in_progress' ? 'info' : 'gray'}>{j.status}</Badge>
                            <span style={{ fontFamily: 'Space Mono, monospace', color: 'var(--acc2)' }}>${j.budgetMin}–${j.budgetMax}</span>
                            <Button variant="ghost" size="xs" onClick={() => toast.success('Job reviewed')}>Review</Button>
                            <Button variant="danger" size="xs" onClick={() => handleRemoveJob(j._id, j.title)} disabled={deleting === j._id}>{deleting === j._id ? 'Removing...' : 'Remove'}</Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
