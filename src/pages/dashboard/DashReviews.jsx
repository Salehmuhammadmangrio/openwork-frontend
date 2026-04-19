import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { Button, Card, PageLoader, EmptyState, Badge } from '../../components/common/UI';
import { formatCurrency, formatDate, statusColor } from '../../utils/helpers';
import { useFetch } from '../../hooks';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function DashReviews() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { data, loading, refetch } = useFetch('/orders?status=delivered,completed,revision_requested,disputed');
    const { data: receivedReviewsData, loading: receivedReviewsLoading } = useFetch('/reviews/user/' + user?._id);
    const { data: givenReviewsData, loading: givenReviewsLoading } = useFetch('/reviews/my/given');
    const orders = data?.orders || [];
    const receivedReviews = receivedReviewsData?.reviews || [];
    const givenReviews = givenReviewsData?.reviews || [];
    const [filter, setFilter] = useState('pending');
    const [activeTab, setActiveTab] = useState('to_give');

    const reviewedOrders = orders.filter(order => {
        if (filter === 'pending') return order.status === 'delivered';
        if (filter === 'completed') return order.status === 'completed';
        return true;
    });

    const handleNavigateToReview = (orderId) => {
        navigate(`/dashboard/orders/${orderId}/review`);
    };

    const renderStars = (rating) => {
        return '⭐'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
    };

    if (loading || receivedReviewsLoading || givenReviewsLoading) return <PageLoader />;

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>My Reviews</h1>
                <p style={{ color: 'var(--txt2)', marginTop: 4 }}>Manage reviews and client feedback.</p>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--b1)', paddingBottom: '1rem' }}>
                <Button
                    variant={activeTab === 'to_give' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('to_give')}
                >
                    To Review ({givenReviews.length})
                </Button>
                <Button
                    variant={activeTab === 'received' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('received')}
                >
                    Reviews Received ({receivedReviews.length})
                </Button>
            </div>

            {/* Reviews to Give Tab */}
            {activeTab === 'to_give' && (
                <>

                    {/* Reviews Given Section */}
                    {givenReviews.length > 0 && (
                        <>
                            <div style={{ marginTop: '2.5rem', marginBottom: '1rem' }}>
                                <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>✓ Reviews You've Given ({givenReviews.length})</h2>
                                <p style={{ fontSize: '0.82rem', color: 'var(--txt3)', marginTop: 4 }}>Reviews you've left for clients and freelancers</p>
                            </div>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {givenReviews.map((review) => (
                                    <Card
                                        key={review._id}
                                        style={{
                                            padding: '1.25rem',
                                            transition: 'all 0.2s ease',
                                            opacity: 0.9,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.boxShadow = 'var(--shadow)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--s1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                                                    {review.reviewType?.includes('freelancer') ? '👤' : '🏢'}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{review.reviewee?.fullName || 'Unknown User'}</div>
                                                    <div style={{ fontSize: '0.82rem', color: 'var(--txt3)', marginTop: 2 }}>
                                                        {review.reviewee?.title && `${review.reviewee.title} · `}
                                                        For: {review.order?.title || 'Unknown Order'}
                                                    </div>
                                                    <div style={{ fontSize: '0.82rem', color: 'var(--txt3)', marginTop: 4 }}>
                                                        {formatDate(review.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{renderStars(review.rating)}</div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--acc2)' }}>{review.rating.toFixed(1)}/5</div>
                                            </div>
                                        </div>

                                        {review.comment && (
                                            <div style={{
                                                background: 'var(--s1)',
                                                padding: '0.875rem',
                                                borderRadius: 8,
                                                fontSize: '0.875rem',
                                                color: 'var(--txt2)',
                                                lineHeight: 1.5,
                                                borderLeft: '3px solid var(--ok)',
                                            }}>
                                                "{review.comment}"
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Reviews Received Tab */}
            {activeTab === 'received' && (
                <>
                    {receivedReviews.length === 0 ? (
                        <EmptyState
                            icon="⭐"
                            title="No reviews received yet"
                            description="Your first review will appear here once clients complete their feedback"
                        />
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {receivedReviews.map((review) => (
                                <Card
                                    key={review._id}
                                    style={{
                                        padding: '1.25rem',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = 'var(--shadow)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                                            {review.reviewer?.profileImage && (
                                                <img
                                                    src={review.reviewer.profileImage}
                                                    alt={review.reviewer.fullName}
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
                                                        border: '1px solid var(--b1)',
                                                    }}
                                                />
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{review.reviewer?.fullName || 'Client'}</div>
                                                <div style={{ fontSize: '0.82rem', color: 'var(--txt3)', marginTop: 2 }}>
                                                    {review.reviewer?.title && `${review.reviewer.title} · `}
                                                    For: {review.order?.title || 'Unknown Order'}
                                                </div>
                                                <div style={{ fontSize: '0.82rem', color: 'var(--txt3)', marginTop: 4 }}>
                                                    {formatDate(review.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{renderStars(review.rating)}</div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--acc2)' }}>{review.rating.toFixed(1)}/5</div>
                                        </div>
                                    </div>

                                    {review.comment && (
                                        <div style={{
                                            background: 'var(--s1)',
                                            padding: '0.875rem',
                                            borderRadius: 8,
                                            fontSize: '0.875rem',
                                            color: 'var(--txt2)',
                                            lineHeight: 1.5,
                                            marginBottom: '0.875rem',
                                            borderLeft: '3px solid var(--acc)',
                                        }}>
                                            "{review.comment}"
                                        </div>
                                    )}

                                    {review.categories && Object.keys(review.categories).length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                                            {Object.entries(review.categories).map(([key, value]) => (
                                                <Badge
                                                    key={key}
                                                    color={value >= 4 ? 'ok' : value >= 3 ? 'acc' : 'err'}
                                                    style={{ fontSize: '0.7rem' }}
                                                >
                                                    {key.replace(/_/g, ' ')}: {value}/5
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
