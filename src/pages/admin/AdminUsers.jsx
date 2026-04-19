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

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [actionUser, setActionUser] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/users', { params: { search, role, limit: 20 } });
            setUsers(data.users || []);
            setTotal(data.total || 0);
        } catch { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    }, [search, role]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const updateUser = async (id, updates) => {
        try {
            await api.put(`/admin/users/${id}`, updates);
            toast.success('✅ User updated successfully');
            fetchUsers();
            setActionUser(null);
        } catch { toast.error('Update failed'); }
    };

    return (
        <div>
            {/* Header */}
            <div style={{ ...adminStyles.header, marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={adminStyles.headerTitle}>👥 User Management</h1>
                    <p style={adminStyles.headerSubtitle}>
                        {total} registered {total === 1 ? 'user' : 'users'} • {loading ? 'Loading...' : users.length + ' shown'}
                    </p>
                </div>
                <Button variant="ghost" size="sm" onClick={fetchUsers} style={{ fontSize: '1.2rem' }}>🔄</Button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <input
                    className="input"
                    style={{
                        flex: 1,
                        minWidth: 280,
                        padding: '11px 1.2rem',
                        background: 'var(--s1)',
                        border: '1px solid var(--b1)',
                        borderRadius: 10,
                        color: 'var(--txt)',
                        fontSize: '0.9rem'
                    }}
                    placeholder="🔍 Search by name, email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <select
                    className="select"
                    style={{
                        padding: '11px 1.2rem',
                        minWidth: 160,
                        background: 'var(--s1)',
                        border: '1px solid var(--b1)',
                        borderRadius: 10,
                        color: 'var(--txt)',
                        fontSize: '0.9rem'
                    }}
                    value={role}
                    onChange={e => setRole(e.target.value)}
                >
                    <option value="">All Roles</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="client">Client</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {/* Users Table */}
            <div style={{
                background: 'var(--s1)',
                border: '1px solid var(--b1)',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center' }}><PageLoader /></div>
                ) : users.length === 0 ? (
                    <div style={{ padding: '3rem' }}>
                        <EmptyState icon="👥" title="No users found" message="Try adjusting your filters" />
                    </div>
                ) : (
                    <>
                        {/* Table Header */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1.5fr 1fr 1.2fr 1.2fr 1.2fr',
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
                            <div>👤 Name & Email</div>
                            <div>🎭 Role</div>
                            <div>✅ Status</div>
                            <div>⭐ Rating</div>
                            <div>🎯 Actions</div>
                        </div>

                        {/* Table Rows */}
                        {users.map((u, i) => (
                            <div
                                key={u._id}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1.5fr 1fr 1.2fr 1.2fr 1.2fr',
                                    gap: '1.5rem',
                                    padding: '1.5rem 2rem',
                                    borderBottom: i < users.length - 1 ? '1px solid var(--b1)' : 'none',
                                    alignItems: 'center',
                                    transition: 'all 0.3s ease',
                                    background: i % 2 === 0 ? 'transparent' : 'rgba(108,78,246,0.03)'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'linear-gradient(90deg, rgba(108,78,246,0.08) 0%, transparent 100%)';
                                    e.currentTarget.style.borderLeft = '3px solid var(--acc)';
                                    e.currentTarget.style.paddingLeft = 'calc(2rem - 3px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(108,78,246,0.03)';
                                    e.currentTarget.style.borderLeft = 'none';
                                    e.currentTarget.style.paddingLeft = '2rem';
                                }}
                            >
                                {/* Name */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                                    <Avatar name={u.fullName} image={u.profileImage} size={40} radius={8}  />
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--txt)', marginBottom: '0.2rem' }}>
                                            {u.fullName}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--txt3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {u.email}
                                        </div>
                                    </div>
                                </div>

                                {/* Role */}
                                <div>
                                    <Badge variant={u.role === 'admin' ? 'err' : u.role === 'client' ? 'teal' : 'info'}>
                                        {u.role?.toUpperCase()}
                                    </Badge>
                                </div>

                                {/* Status */}
                                <div style={adminStyles.getStatusStyle(u.isBanned ? 'inactive' : u.isVerified ? 'active' : 'pending')}>
                                    {u.isBanned ? '🔴 Banned' : u.isVerified ? '✅ Verified' : '⏳ Pending'}
                                </div>

                                {/* Rating */}
                                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--txt)' }}>
                                    ⭐ {u.averageRating?.toFixed(1) || '0.0'}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.7rem', justifyContent: 'flex-start' }}>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setActionUser(u)}
                                        style={{
                                            padding: '0.6rem 1rem',
                                            fontSize: '0.85rem',
                                            borderRadius: 8,
                                            border: '1px solid var(--b1)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        👁️ View
                                    </Button>
                                    <Button
                                        variant={u.isBanned ? 'success' : 'danger'}
                                        size="sm"
                                        onClick={() => updateUser(u._id, { isBanned: !u.isBanned })}
                                        style={{
                                            padding: '0.6rem 1rem',
                                            fontSize: '0.85rem',
                                            borderRadius: 8,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {u.isBanned ? '✅ Unban' : '🚫 Ban'}
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {/* Footer */}
                        <div style={{
                            padding: '1.2rem 2rem',
                            fontSize: '0.85rem',
                            color: 'var(--txt3)',
                            background: 'var(--s2)',
                            borderTop: '1px solid var(--b1)',
                            fontWeight: 600
                        }}>
                            📊 Showing {users.length} of {total} users
                        </div>
                    </>
                )}
            </div>

            {/* User Detail Modal */}
            {actionUser && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setActionUser(null)}>
                    <div className="modal" style={{ width: '500px', background: 'var(--s1)' }}>
                        <div className="modal-header" style={{ borderBottom: '1px solid var(--b1)', background: 'var(--s2)' }}>
                            <span className="modal-title">👤 User Profile</span>
                            <button className="modal-close" onClick={() => setActionUser(null)}>✕</button>
                        </div>
                        <div className="modal-body" style={{ padding: '2rem' }}>
                            {/* Profile Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                                <Avatar name={actionUser.fullName} size={72} radius={14} />
                                <div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--txt)', marginBottom: '0.25rem' }}>
                                        {actionUser.fullName}
                                    </div>
                                    <div style={{ color: 'var(--txt2)', fontSize: '0.9rem' }}>{actionUser.email}</div>
                                    <Badge variant={actionUser.role === 'admin' ? 'err' : actionUser.role === 'client' ? 'teal' : 'info'} style={{ marginTop: '0.5rem' }}>
                                        {actionUser.role?.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
                                {[
                                    ['AI Score', actionUser.aiSkillScore || '—', '🤖'],
                                    ['Rating', actionUser.averageRating?.toFixed(1) || '—', '⭐'],
                                    ['Jobs Done', actionUser.completedJobs || '0', '✅'],
                                    ['Total Earned', formatCurrency(actionUser.totalEarned || 0), '💰'],
                                ].map(([label, value, emoji]) => (
                                    <div key={label} style={{ background: 'var(--s2)', padding: '1rem', borderRadius: 10, border: '1px solid var(--b1)' }}>
                                        <div style={{ color: 'var(--txt3)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '0.5rem' }}>
                                            {emoji} {label}
                                        </div>
                                        <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--txt)' }}>
                                            {value}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Account Info */}
                            <div style={{ background: 'var(--s2)', padding: '1.25rem', borderRadius: 10, marginBottom: '2rem', border: '1px solid var(--b1)' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3px', color: 'var(--txt2)' }}>Account Info</h4>
                                {[
                                    ['Joined', formatDate(actionUser.createdAt)],
                                    ['Verification', actionUser.isVerified ? '✅ Verified' : '⏳ Unverified'],
                                    ['Ban Status', actionUser.isBanned ? '🔴 Banned' : '✅ Active'],
                                ].map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--b1)', fontSize: '0.9rem', color: 'var(--txt2)' }}>
                                        <span>{label}</span>
                                        <strong style={{ color: 'var(--txt)' }}>{value}</strong>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <Button
                                    variant="primary"
                                    full
                                    onClick={() => updateUser(actionUser._id, { isVerified: !actionUser.isVerified })}
                                    style={{
                                        background: actionUser.isVerified ? 'rgba(108,78,246,0.2)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    }}
                                >
                                    {actionUser.isVerified ? '🔍 Revoke Verification' : '✅ Verify Account'}
                                </Button>
                                <Button
                                    variant="primary"
                                    full
                                    onClick={() => updateUser(actionUser._id, { isBanned: !actionUser.isBanned })}
                                    style={{
                                        background: actionUser.isBanned ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, var(--err) 0%, #dc2626 100%)',
                                    }}
                                >
                                    {actionUser.isBanned ? '✅ Unban User' : '🔴 Ban User'}
                                </Button>
                                <Button variant="ghost" full onClick={() => setActionUser(null)}>Cancel</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}