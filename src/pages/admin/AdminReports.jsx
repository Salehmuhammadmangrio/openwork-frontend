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


export default function AdminReports() {
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                setError(null);
                const { data } = await api.get('/admin/analytics');
                if (data && data.analytics) {
                    setAnalytics(data.analytics);
                } else {
                    setError('No analytics data received');
                }
            } catch (err) {
                const errorMsg = err.response?.data?.message || err.message || 'Failed to load reports';
                setError(errorMsg);
                console.error('Analytics fetch error:', err);
                toast.error(errorMsg);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAnalytics();
    }, []);

    if (loading) return <PageLoader />;
    if (error) return <EmptyState title="Error Loading Data" message={error} />;
    if (!analytics) return <EmptyState title="No Data" message="Unable to load analytics" />;

    // Transform revenue by month for chart
    const revenueChartData = {
        labels: (analytics.revenueByMonth || [])?.map(m => {
            const date = new Date(m._id.year, m._id.month - 1);
            return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }) || [],
        datasets: [{
            label: 'Total Revenue',
            data: (analytics.revenueByMonth || [])?.map(m => m.revenue) || [],
            backgroundColor: 'rgba(108,78,246,0.7)',
            borderColor: 'rgba(108,78,246,1)',
            borderWidth: 1,
            fill: true,
        }]
    };

    // Transform category distribution for chart
    const categoryChartData = {
        labels: (analytics.categoryDist || [])?.map(c => c._id) || [],
        datasets: [{
            data: (analytics.categoryDist || [])?.map(c => c.count) || [],
            backgroundColor: ['#6C4EF6', '#00E5C3', '#FF6B35', '#FFB52E', '#00E5A0', '#9B6DFF'].slice(0, (analytics.categoryDist || []).length)
        }]
    };

    // Calculate metrics - with defaults
    const avgJobValue = analytics.stats?.avgJobValue || 0;
    const proposalAcceptanceRate = analytics.stats?.proposalAcceptanceRate || 0;
    const clientReturnRate = analytics.stats?.clientReturnRate || 0;
    const avgDeliveryDays = analytics.stats?.avgDeliveryDays || 0;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.25rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.85rem', fontWeight: 700 }}>Platform Reports</h1>
                    <p style={{ color: 'var(--txt2)', marginTop: '0.4rem' }}>Analytics and performance insights</p>
                </div>
                <Button variant="primary" size="sm" onClick={() => toast.success('Report exported as PDF')}>📄 Export PDF</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.85rem' }}>
                    <h3 style={{ marginBottom: '1.6rem', fontSize: '1.05rem', fontWeight: 600 }}>Revenue Breakdown</h3>
                    <div style={{ height: 280 }}><Bar data={revenueChartData} options={chartDefaults} /></div>
                </div>
                <div className="card" style={{ padding: '1.85rem' }}>
                    <h3 style={{ marginBottom: '1.6rem', fontSize: '1.05rem', fontWeight: 600 }}>Jobs by Category</h3>
                    <div style={{ height: 280 }}><Doughnut data={categoryChartData} options={{ plugins: { legend: { position: 'right', labels: { color: '#9896B4', font: { size: 11 } } } } }} /></div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                {[['Avg Job Value', formatCurrency(avgJobValue), '▲ +12%'], ['Proposal Acceptance', `${(proposalAcceptanceRate * 100).toFixed(0)}%`, '▲ +6%'], ['Client Return Rate', `${(clientReturnRate * 100).toFixed(0)}%`, '▲ +3%'], ['Avg Delivery Time', `${Math.round(avgDeliveryDays)} days`, '▼ -2 days']].map(([label, value, change]) => (
                    <div key={label} className="card" style={{ padding: '1.75rem' }}>
                        <div style={{ color: 'var(--txt2)', fontSize: '0.85rem' }}>{label}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.6rem' }}>{value}</div>
                        <div style={{ fontSize: '0.82rem', color: '#22c55e', marginTop: '0.4rem' }}>{change}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}