import React, { useState } from 'react';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';

/**
 * RoleSwitcher Component
 * Allows authenticated users to switch between roles (freelancer/client)
 * Only visible when user has dual-role capabilities
 */
const RoleSwitcher = () => {
    const user = useAuthStore(s => s.user);
    const activeRole = useAuthStore(s => s.activeRole);
    const setActiveRole = useAuthStore(s => s.setActiveRole);
    const toggleRole = useAuthStore(s => s.toggleRole);
    const isLoading = useAuthStore(s => s.isLoading);
    const [isOpen, setIsOpen] = useState(false);

    if (!user) return null;

    // Determine available roles
    const canBeClient = user.role === 'client' || user.canActAsClient;
    const canBeFreelancer = user.role === 'freelancer' || user.canActAsFreelancer || user.role === 'admin';
    const availableRoles = [];

    if (canBeClient) availableRoles.push('client');
    if (canBeFreelancer) availableRoles.push('freelancer');

    // Don't show switcher if only one role available or admin
    if (availableRoles.length < 2 || user.role === 'admin') {
        return null;
    }

    const handleRoleChange = async (newRole) => {
        if (newRole === activeRole) {
            setIsOpen(false);
            return;
        }

        try {
            setActiveRole(newRole);
            setIsOpen(false);
            toast.success(`Switched to ${newRole} mode`);
        } catch (error) {
            toast.error('Failed to switch role');
        }
    };

    const getRoleIcon = (role) => {
        return role === 'freelancer' ? '💼' : '🏢';
    };

    const getRoleLabel = (role) => {
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    return (
        <div style={{ position: 'relative' }}>
            {/* Role Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    borderRadius: 9,
                    background: activeRole === 'freelancer'
                        ? 'rgba(108, 78, 246, 0.15)'
                        : 'rgba(34, 197, 94, 0.15)',
                    border: activeRole === 'freelancer'
                        ? '1px solid rgba(108, 78, 246, 0.3)'
                        : '1px solid rgba(34, 197, 94, 0.3)',
                    color: 'var(--txt)',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    opacity: isLoading ? 0.6 : 1,
                }}
                title={`Current role: ${getRoleLabel(activeRole)}. Click to switch`}
                onMouseEnter={(e) => {
                    if (!isLoading) {
                        e.target.style.background = activeRole === 'freelancer'
                            ? 'rgba(108, 78, 246, 0.25)'
                            : 'rgba(34, 197, 94, 0.25)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.target.style.background = activeRole === 'freelancer'
                        ? 'rgba(108, 78, 246, 0.15)'
                        : 'rgba(34, 197, 94, 0.15)';
                }}
            >
                <span>{getRoleIcon(activeRole)}</span>
                <span>{getRoleLabel(activeRole)}</span>
                {availableRoles.length > 1 && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--txt3)', marginLeft: 4 }}>
                        {isOpen ? '▲' : '▼'}
                    </span>
                )}
            </button>

            {/* Role Dropdown */}
            {isOpen && !isLoading && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        minWidth: 200,
                        background: 'var(--s2)',
                        border: '1px solid var(--b2)',
                        borderRadius: 12,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
                        zIndex: 1000,
                        overflow: 'hidden',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: '0.75rem 1rem',
                            borderBottom: '1px solid var(--b1)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: 'var(--txt3)',
                            letterSpacing: '0.5px',
                        }}
                    >
                        Switch Role
                    </div>

                    {/* Role Options */}
                    <div style={{ padding: '0.5rem' }}>
                        {availableRoles.map((role) => (
                            <button
                                key={role}
                                onClick={() => handleRoleChange(role)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '0.75rem 0.875rem',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: activeRole === role ? 'var(--acc1)' : 'transparent',
                                    color: activeRole === role ? 'var(--acc)' : 'var(--txt2)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: activeRole === role ? 600 : 500,
                                    transition: 'all 0.15s',
                                    textAlign: 'left',
                                }}
                                onMouseEnter={(e) => {
                                    if (activeRole !== role) {
                                        e.target.style.background = 'var(--s1)';
                                        e.target.style.color = 'var(--txt)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = activeRole === role ? 'var(--acc1)' : 'transparent';
                                    e.target.style.color = activeRole === role ? 'var(--acc)' : 'var(--txt2)';
                                }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>{getRoleIcon(role)}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        {getRoleLabel(role)}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginTop: 2 }}>
                                        {role === 'freelancer'
                                            ? 'Offer services'
                                            : 'Post jobs & hire'}
                                    </div>
                                </div>
                                {activeRole === role && (
                                    <span style={{ fontSize: '1rem', marginLeft: 'auto' }}>✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleSwitcher;
