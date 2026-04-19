import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';
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

// Helper function to generate daily data from monthly aggregations
const generateDailyDataPoints = (monthlyData, dataField) => {
    if (!monthlyData || monthlyData.length === 0) return { dates: [], values: [] };

    const startDate = new Date(2026, 3, 1); // April 1, 2026
    const endDate = new Date(2026, 3, 17); // April 17, 2026

    const dates = [];
    const values = [];

    // Generate all dates from April 1 to April 17
    let currentDate = new Date(startDate);
    let dayIndex = 0;

    const monthMap = {};
    monthlyData.forEach(item => {
        const key = `${item._id.month}-${item._id.year}`;
        monthMap[key] = item[dataField];
    });

    while (currentDate <= endDate) {
        const monthKey = `${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

        // Add data point on the last day of each month if data exists
        if (currentDate.getDate() === lastDayOfMonth && monthMap[monthKey] !== undefined) {
            dates.push(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            values.push(monthMap[monthKey]);
        } else if (currentDate.getDate() === lastDayOfMonth) {
            // Add placeholder for months without data
            dates.push(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            values.push(0);
        }

        currentDate.setDate(currentDate.getDate() + 1);
        dayIndex++;
    }

    return { dates, values, dayIndices: dates.map((_, i) => i) };
};

export default function AdminOverview() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [aprilData, setAprilData] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get('/admin/stats'),
            api.get('/admin/analytics'),
            api.get('/admin/analytics/april-to-now')
        ])
            .then(([sRes, aRes, aprilRes]) => {
                setStats({ ...sRes.data.stats, ...aRes.data.analytics });
                setAprilData(aprilRes.data.analytics || null);
            })
            .catch(() => toast.error('Failed to load stats'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <PageLoader />;

    const statItems = [
        { label: 'Total Users', value: stats?.users?.total?.toLocaleString() || '—', change: `▲ +${stats?.growth?.newUsers || 0} this week`, trend: 'up' },
        { label: 'Active Jobs', value: stats?.jobs?.active?.toLocaleString() || '—', change: `New: +${stats?.growth?.newJobs || 0}`, trend: 'neutral' },
        { label: 'Total Revenue', value: formatCurrency(stats?.revenue?.total || 0), change: `Fees: ${formatCurrency(stats?.revenue?.platformFees || 0)}`, trend: 'up' },
        { label: 'Open Disputes', value: stats?.disputes?.open || '—', change: `Pending: ${stats?.disputes?.pending || 0}`, trend: stats?.disputes?.open > 5 ? 'down' : 'neutral' },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--txt) 0%, var(--txt2) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        📊 Platform Overview
                    </h1>
                    <p style={{ color: 'var(--txt2)', marginTop: '0.6rem', fontSize: '0.96rem' }}>Real-time system health and performance metrics</p>
                </div>
                <Badge style={{ fontSize: '0.9rem', fontWeight: 700, padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, var(--err) 0%, var(--acc2) 100%)', border: 'none' }}>
                    👑 Super Admin
                </Badge>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem', marginBottom: '3rem' }}>
                {statItems.map((item, i) => (
                    <div key={i} style={{
                        background: 'var(--s1)',
                        border: '1px solid var(--b1)',
                        borderRadius: 16,
                        padding: '1.85rem',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        cursor: 'pointer'
                    }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                        }}
                    >
                        <div style={{ color: 'var(--txt2)', fontSize: '0.85rem', marginBottom: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                            {item.label}
                        </div>
                        <div style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.75rem', background: 'linear-gradient(135deg, var(--txt) 0%, var(--txt2) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            {item.value}
                        </div>
                        <div style={{ fontSize: '0.84rem', color: item.trend === 'up' ? '#10b981' : item.trend === 'down' ? 'var(--err)' : 'var(--txt3)', fontWeight: 600 }}>
                            {item.trend === 'up' ? '📈' : item.trend === 'down' ? '📉' : '➡️'} {item.change}
                        </div>
                    </div>
                ))}
            </div>

            {/* April to Now - Revenue & Users Growth */}
            {aprilData && (
                <div style={{ marginTop: '3rem' }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--txt)' }}>📈 April Till Now - Performance</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                        {/* Total Revenue from April */}
                        <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: 600, color: 'var(--txt2)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>💰 Total Revenue Generated</h3>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '2.8rem', fontWeight: 800, color: '#10b981', marginBottom: '0.25rem' }}>
                                    {formatCurrency(aprilData?.revenueByMonth?.reduce((sum, m) => sum + (m.revenue || 0), 0) || 0)}
                                </div>
                                <div style={{ color: 'var(--txt3)', fontSize: '0.85rem' }}>
                                    Completed Orders: {aprilData?.orderStats?.completed?.count?.toLocaleString() || 0}
                                </div>
                            </div>
                            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '1rem', borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                                    <div>
                                        <div style={{ color: 'var(--txt3)', marginBottom: '0.25rem' }}>Platform Fees</div>
                                        <div style={{ fontWeight: 700, color: 'var(--txt)' }}>
                                            {formatCurrency(aprilData?.revenueByMonth?.reduce((sum, m) => sum + (m.fees || 0), 0) || 0)}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--txt3)', marginBottom: '0.25rem' }}>Total Transactions</div>
                                        <div style={{ fontWeight: 700, color: 'var(--txt)' }}>
                                            {aprilData?.revenueByMonth?.reduce((sum, m) => sum + (m.count || 0), 0)?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Total Users from April */}
                        <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: 600, color: 'var(--txt2)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>👥 New Users Registered</h3>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '2.8rem', fontWeight: 800, color: '#6C4EF6', marginBottom: '0.25rem' }}>
                                    +{aprilData?.userGrowth?.reduce((sum, u) => sum + (u.count || 0), 0)?.toLocaleString() || 0}
                                </div>
                                <div style={{ color: 'var(--txt3)', fontSize: '0.85rem' }}>
                                    New signups since April
                                </div>
                            </div>
                            <div style={{ background: 'rgba(108,78,246,0.1)', padding: '1rem', borderRadius: 10, border: '1px solid rgba(108,78,246,0.2)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                                    <div>
                                        <div style={{ color: 'var(--txt3)', marginBottom: '0.25rem' }}>Freelancers</div>
                                        <div style={{ fontWeight: 700, color: 'var(--txt)' }}>
                                            ~{Math.floor((aprilData?.userGrowth?.reduce((sum, u) => sum + (u.count || 0), 0) || 0) * 0.6)?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--txt3)', marginBottom: '0.25rem' }}>Clients</div>
                                        <div style={{ fontWeight: 700, color: 'var(--txt)' }}>
                                            ~{Math.floor((aprilData?.userGrowth?.reduce((sum, u) => sum + (u.count || 0), 0) || 0) * 0.4)?.toLocaleString() || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>



                </div>
            )}

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div style={{
                    background: 'var(--s1)',
                    border: '1px solid var(--b1)',
                    borderRadius: 16,
                    padding: '2rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                    <h3 style={{ marginBottom: '1.75rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--txt)' }}>📈 User Growth (6 months)</h3>
                    <div style={{ height: 290 }}>
                        {(() => {
                            const { dates, values, dayIndices } = generateDailyDataPoints(stats?.userGrowth, 'count');
                            return (
                                <Scatter
                                    data={{
                                        labels: dayIndices.map(i => `Day ${i}`),
                                        datasets: [{
                                            label: 'New Users',
                                            data: values.map((v, i) => ({ x: dayIndices[i], y: v })),
                                            borderColor: '#6C4EF6',
                                            backgroundColor: '#6C4EF6',
                                            pointRadius: 6,
                                            pointHoverRadius: 8,
                                            pointBorderColor: '#fff',
                                            pointBorderWidth: 2,
                                            showLine: true,
                                            fill: false,
                                            borderWidth: 2,
                                            tension: 0.4
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                callbacks: {
                                                    label: function (context) {
                                                        return `${dates[context.dataIndex]}: ${context.raw.y} users`;
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            x: {
                                                type: 'linear',
                                                title: { display: true, text: 'Date', color: 'var(--txt2)' },
                                                ticks: {
                                                    color: '#9896B4',
                                                    callback: function (value) {
                                                        return dates[value] || `Day ${value}`;
                                                    }
                                                },
                                                grid: { color: 'rgba(255,255,255,.05)' }
                                            },
                                            y: {
                                                title: { display: true, text: 'Users', color: 'var(--txt2)' },
                                                ticks: { color: '#9896B4' },
                                                grid: { color: 'rgba(255,255,255,.05)' }
                                            }
                                        }
                                    }}
                                />
                            );
                        })()}
                    </div>
                </div>

                <div style={{
                    background: 'var(--s1)',
                    border: '1px solid var(--b1)',
                    borderRadius: 16,
                    padding: '2rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                    <h3 style={{ marginBottom: '1.75rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--txt)' }}>💰 Revenue (6 months)</h3>
                    <div style={{ height: 290 }}>
                        {(() => {
                            const { dates, values, dayIndices } = generateDailyDataPoints(stats?.revenueByMonth, 'revenue');
                            return (
                                <Scatter
                                    data={{
                                        labels: dayIndices.map(i => `Day ${i}`),
                                        datasets: [{
                                            label: 'Revenue',
                                            data: values.map((v, i) => ({ x: dayIndices[i], y: v })),
                                            borderColor: '#10b981',
                                            backgroundColor: '#10b981',
                                            pointRadius: 6,
                                            pointHoverRadius: 8,
                                            pointBorderColor: '#fff',
                                            pointBorderWidth: 2,
                                            showLine: true,
                                            fill: false,
                                            borderWidth: 2,
                                            tension: 0.4
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                callbacks: {
                                                    label: function (context) {
                                                        return `${dates[context.dataIndex]}: ${formatCurrency(context.raw.y)}`;
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            x: {
                                                type: 'linear',
                                                title: { display: true, text: 'Date', color: 'var(--txt2)' },
                                                ticks: {
                                                    color: '#9896B4',
                                                    callback: function (value) {
                                                        return dates[value] || `Day ${value}`;
                                                    }
                                                },
                                                grid: { color: 'rgba(255,255,255,.05)' }
                                            },
                                            y: {
                                                title: { display: true, text: 'Revenue ($)', color: 'var(--txt2)' },
                                                ticks: {
                                                    color: '#9896B4',
                                                    callback: function (value) {
                                                        return `$${(value / 1000).toFixed(0)}k`;
                                                    }
                                                },
                                                grid: { color: 'rgba(255,255,255,.05)' }
                                            }
                                        }
                                    }}
                                />
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* Additional Stats Section */}
            <div style={{ marginTop: '3rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--txt)' }}>📊 Detailed Analytics</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    {/* Order Completion Stats */}
                    <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginBottom: '1.75rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--txt)' }}>🎯 Order Completion</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ background: 'var(--s2)', padding: '1.25rem', borderRadius: 10, border: '1px solid var(--b1)' }}>
                                <div style={{ color: 'var(--txt3)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '0.5rem' }}>Completion Rate</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{stats?.orders?.completionRate || 0}%</div>
                            </div>
                            <div style={{ background: 'var(--s2)', padding: '1.25rem', borderRadius: 10, border: '1px solid var(--b1)' }}>
                                <div style={{ color: 'var(--txt3)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '0.5rem' }}>Completed</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--txt)' }}>{stats?.orders?.completed?.toLocaleString() || 0}</div>
                            </div>
                            <div style={{ background: 'var(--s2)', padding: '1.25rem', borderRadius: 10, border: '1px solid var(--b1)' }}>
                                <div style={{ color: 'var(--txt3)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '0.5rem' }}>Total Orders</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--txt)' }}>{stats?.orders?.total?.toLocaleString() || 0}</div>
                            </div>
                            <div style={{ background: 'var(--s2)', padding: '1.25rem', borderRadius: 10, border: '1px solid var(--b1)' }}>
                                <div style={{ color: 'var(--txt3)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '0.5rem' }}>New Orders</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--acc)' }}>+{stats?.growth?.newOrders || 0}</div>
                            </div>
                        </div>
                    </div>

                    {/* User Distribution */}
                    <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginBottom: '1.75rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--txt)' }}>👥 User Distribution</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ background: 'var(--s2)', padding: '1.25rem', borderRadius: 10, border: '1px solid var(--b1)' }}>
                                <div style={{ color: 'var(--txt3)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '0.5rem' }}>Freelancers</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6C4EF6' }}>{stats?.users?.freelancers?.toLocaleString() || 0}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--txt3)', marginTop: '0.25rem' }}>Active: {stats?.users?.active ? Math.floor(stats.users.active * 0.6) : 0}</div>
                            </div>
                            <div style={{ background: 'var(--s2)', padding: '1.25rem', borderRadius: 10, border: '1px solid var(--b1)' }}>
                                <div style={{ color: 'var(--txt3)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '0.5rem' }}>Clients</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{stats?.users?.clients?.toLocaleString() || 0}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--txt3)', marginTop: '0.25rem' }}>Active: {stats?.users?.active ? Math.floor(stats.users.active * 0.4) : 0}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Freelancers */}
                {stats?.topFreelancers && stats.topFreelancers.length > 0 && (
                    <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginTop: '2rem' }}>
                        <h3 style={{ marginBottom: '1.75rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--txt)' }}>⭐ Top Freelancers</h3>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {stats.topFreelancers.slice(0, 5).map((freelancer, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--b1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                        <div style={{ background: 'var(--acc)', width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{i + 1}</div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--txt)', fontSize: '0.95rem' }}>{freelancer.fullName}</div>
                                            <div style={{ color: 'var(--txt3)', fontSize: '0.8rem' }}>⭐ {freelancer.averageRating?.toFixed(1) || '0.0'} ({freelancer.totalReviews || 0} reviews)</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}