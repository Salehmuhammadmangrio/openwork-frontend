import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useAuthStore } from '../../store';
import { useFetch } from '../../hooks';
import { StatCard, Card, Badge, Button, ProgressBar, EmptyState, PageLoader } from '../../components/common/UI';
import { formatCurrency, statusColor } from '../../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const chartDefaults = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9896B4', font: { size: 10 } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9896B4', font: { size: 10 } } },
  },
};

import api from '../../utils/api';
import toast from 'react-hot-toast';



export default function DashOverview() {
  const { user, activeRole, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [hour] = useState(new Date().getHours());
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const { data: ordersData, loading: ordersLoading } = useFetch('/orders/my', { limit: 3 });
  const { data: jobsData, loading: jobsLoading } = useFetch('/jobs', { limit: 4, sort: '-createdAt' });
  const { data: proposalsData } = useFetch('/proposals/my', { limit: 5 });
  // const { data: paymentsData } = useFetch('/payments', { limit: 10 });
  const { data: postedJobsData, loading: postedJobsLoading } = useFetch('/jobs/my', { limit: 5, sort: '-createdAt' });
  const { data: statsData, loading: statsLoading } = useFetch('/users/dashboard/stats');

  //=======================================



  const [resending, setResending] = useState(false);

  const resendVerification = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification');
      toast.success('Verification email sent! Check your inbox.');
    } catch {
      toast.error('Failed to send email.');
    } finally {
      setResending(false);
    }
  };

  //=====================================

  const orders = ordersData?.orders || [];
  const jobs = jobsData?.jobs || [];
  const proposals = proposalsData?.proposals || [];
  const stats = statsData?.stats || {};
  const postedJobs = postedJobsData?.jobs || [];

  // Update user stats when dashboard stats are loaded
  useEffect(() => {
    if (statsData?.stats) {
      updateUser({
        totalEarned: statsData.stats.totalEarned,
        totalSpent: statsData.stats.totalSpent,
        completedJobs: statsData.stats.completedJobs,
        totalJobs: statsData.stats.totalJobs,
        activeOrders: statsData.stats.activeOrders,
        totalProposals: statsData.stats.totalProposals,
        aiSkillScore: statsData.stats.aiSkillScore,
        averageRating: statsData.stats.averageRating,
      });
    }
  }, [statsData, updateUser]);

  const canClient = user?.role === 'client' || user?.canActAsClient;
  const isClient = (activeRole || (canClient ? 'client' : 'freelancer')) === 'client';

  // Server earnings chart data
  const earningsData = {
    labels: stats.monthlyEarnings?.labels || ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
      data: stats.monthlyEarnings?.data || [0, 0, 0, 0, 0, 0],
      borderColor: '#6C4EF6', backgroundColor: 'rgba(108,78,246,0.08)',
      tension: 0.4, fill: true, pointBackgroundColor: '#6C4EF6', pointRadius: 4,
    }],
  };


  const profileItems = [
    { label: 'Basic info', done: true },
    { label: 'Profile photo', done: !!user?.profileImage },
    { label: 'Bio written', done: !!user?.bio },
    { label: 'Skills added', done: user?.skills?.length > 0 },
    { label: 'Portfolio link', done: !!user?.portfolioUrl },
    { label: 'Skill test passed', done: user?.certifications?.some(c => c.passed) },
  ];
  const profilePct = Math.round((profileItems.filter(i => i.done).length / profileItems.length) * 100);

  if (ordersLoading && jobsLoading && statsLoading) return <PageLoader />;

  return (
    <div className="animate-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{greeting}, {user?.fullName?.split(' ')[0]}! 👋</h1>
          <p style={{ color: 'var(--txt2)', fontSize: '0.875rem', marginTop: 3 }}>
            {isClient ? 'Find the perfect freelancer for your next project.' : 'Ready to find your next opportunity?'}
          </p>
        </div>
        <Button onClick={() => navigate(isClient ? '/jobs' : '/ai')} variant="primary" size="sm">
          {isClient ? '+ Post Job' : '🤖 AI Assistant'}
        </Button>
      </div>



      {!user?.emailVerified && (
        <div style={{
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: 12,
          padding: '0.875rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFC107' }}>
              Email Not Verified
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--txt2)' }}>
              Please verify your email address to unlock all features.
            </div>
          </div>
          <button
            onClick={resendVerification}
            disabled={resending}
            style={{
              background: 'rgba(255,193,7,0.15)',
              border: '1px solid rgba(255,193,7,0.4)',
              color: '#FFC107',
              padding: '6px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            {resending ? 'Sending...' : 'Resend Email'}
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '0.875rem', marginBottom: '1.75rem' }}>
        {isClient ? <>
          <StatCard label="Jobs Posted" value={postedJobs.length || 0} change="" changeType="nt" icon="💼" />
          <StatCard label="Total Spent" value={formatCurrency(stats.totalSpent || 0)} change="▲ Platform total" changeType="up" icon="💰" valueColor="var(--acc2)" />
          <StatCard label="Active Orders" value={stats.activeOrders || 0} change="In progress" changeType="nt" icon="📦" />
          <StatCard label="Proposals Rx" value={stats.totalProposals || 0} change="" changeType="nt" icon="📝" />

        </> : <>
          <StatCard label="Proposals" value={stats.totalProposals || 0} change="" changeType="nt" icon="📝" />
          <StatCard label="Completed" value={stats.completedJobs || 0} change="" changeType="nt" icon="✅" />
          <StatCard label="Total Earned" value={formatCurrency(stats.totalEarned || 0)} change="" changeType="nt" icon="💰" valueColor="var(--acc2)" />

          <StatCard label="AI Score" value={stats.aiSkillScore || 0} change="▲ +5 pts" changeType="up" icon="🤖" valueColor="var(--acc)" />
          <StatCard label="Rating" value={stats.averageRating?.toFixed(1) || "0.0"} change="★★★★★" changeType="nt" icon="⭐" />
        </>}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
        {/* Left Column */}
        <div>
          {/* Earnings Chart */}
          {!isClient && (
            <Card style={{ marginBottom: '1.5rem', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>💰 Earnings (Last 6 Months)</h3>
                <Link to="/dashboard/analytics" style={{ fontSize: '0.75rem', color: 'var(--acc)' }}>View Analytics →</Link>
              </div>
              <div style={{ height: 180 }}><Line data={earningsData} options={chartDefaults} /></div>
            </Card>
          )}

          {/* Jobs Posted - Client */}
          {isClient && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>📋 Jobs Posted</h3>
                <Link to="/dashboard/my-jobs" style={{ fontSize: '0.75rem', color: 'var(--acc)' }}>View All →</Link>
              </div>
              {postedJobsLoading ? (
                <PageLoader />
              ) : postedJobs.length === 0 ? (
                <EmptyState icon="💼" title="No jobs posted yet" description="Create your first job posting to start receiving proposals" />
              ) : (
                postedJobs.map(job => (
                  <div key={job._id} onClick={() => navigate(`/jobs/${job._id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem', background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 12, marginBottom: '0.65rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(108,78,246,.35)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--b1)'}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                      {job.category?.includes('Web') ? '💻' : job.category?.includes('Design') ? '🎨' : job.category?.includes('Data') ? '🤖' : '📋'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--txt2)', marginTop: 2 }}>
                        {job.status && <Badge color={statusColor(job.status)} style={{ fontSize: '0.6rem', marginRight: '0.5rem' }}>{job.status?.replace('_', ' ')}</Badge>}
                        <span style={{ marginLeft: "10px" }}>{job.proposalCount} proposal{(job.totalProposals || job.proposalsCount || job.proposals || 0) !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'Space Mono,monospace', fontSize: '0.78rem', fontWeight: 700, color: 'var(--acc2)' }}>${job.budgetMax?.toLocaleString() || job.budget?.toLocaleString()}</div>
                    </div>
                  </div>
                ))
              )}
              <div style={{ marginTop: '1.5rem' }} />
            </>
          )}

          {/* AI Recommended Jobs - Only for Freelancers */}
          {activeRole === 'freelancer' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>🤖 AI Recommended Jobs</h3>
                <Link to="/jobs" style={{ fontSize: '0.75rem', color: 'var(--acc)' }}>View All →</Link>
              </div>
              {jobsLoading ? <PageLoader /> : jobs.length === 0 ? (
                <EmptyState icon="🔍" title="No jobs found" description="Check back later for new opportunities" />
              ) : jobs.map(job => (
                <div key={job._id} onClick={() => navigate(`/jobs/${job._id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem', background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 12, marginBottom: '0.65rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(108,78,246,.35)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--b1)'}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                    {job.category?.includes('Web') ? '💻' : job.category?.includes('Design') ? '🎨' : job.category?.includes('Data') ? '🤖' : '📱'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--txt2)', marginTop: 2 }}>{job.client?.companyName || job.client?.fullName} · {job.category}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'Space Mono,monospace', fontSize: '0.78rem', fontWeight: 700, color: 'var(--acc2)' }}>${job.budgetMax?.toLocaleString()}</div>
                    {job.isUrgent && <Badge color="err" style={{ marginTop: 3, fontSize: '0.62rem' }}>Urgent</Badge>}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '1.5rem' }} />
            </>
          )}

          {/* Recent Proposals - Only for Freelancers */}
          {!isClient && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>📝 Recent Proposals</h3>
                <Link to="/dashboard/proposals" style={{ fontSize: '0.75rem', color: 'var(--acc)' }}>View All →</Link>
              </div>
              {!proposalsData ? (
                <PageLoader />
              ) : proposals.length === 0 ? (
                <EmptyState icon="📝" title="No proposals yet" description="Apply to jobs to see your proposals here" />
              ) : (
                proposals.map(prop => (
                  <div key={prop._id} onClick={() => navigate(`/jobs/${prop.job?._id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem', background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 12, marginBottom: '0.65rem', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(108,78,246,.35)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--b1)'}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                      📝
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prop.job?.title || 'Job'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--txt2)', marginTop: 2 }}>
                        {prop.job?.client?.companyName || prop.job?.client?.fullName || 'Client'} · Status: {prop.status}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <Badge color={statusColor(prop.status)} style={{ fontSize: '0.65rem', marginBottom: '0.25rem', display: 'block' }}>{prop.status}</Badge>
                      <div style={{ fontFamily: 'Space Mono,monospace', fontSize: '0.78rem', fontWeight: 700, color: 'var(--acc2)' }}>${prop.bidAmount?.toLocaleString()}</div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Right Column */}
        <div>
          {/* Profile Completion */}
          <Card style={{ marginBottom: '1.25rem', padding: '0.875rem', boxShadow: 'var(--inv-shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Profile Completion</h3>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--acc)' }}>{profilePct}%</span>
            </div>
            <ProgressBar value={profilePct} style={{ marginBottom: '0.875rem' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {profileItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
                  <span style={{ color: item.done ? 'var(--ok)' : 'var(--txt3)' }}>{item.done ? '✓' : '○'}</span>
                  <span style={{ color: item.done ? 'var(--txt2)' : 'var(--txt3)' }}>{item.label}</span>
                </div>
              ))}
            </div>
            <Button variant="primary" size="sm" full style={{ marginTop: '1rem' }} onClick={() => navigate('/dashboard/profile')}>
              Complete Profile →
            </Button>
          </Card>

          {/* Recent Orders */}
          <div style={{ boxShadow: 'var(--inv-shadow)', padding: '0.875rem', borderRadius: "8px" }}>
            <div style={{ marginBottom: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700 }}>Active Orders</h3>
              <Link to="/dashboard/orders" style={{ fontSize: '0.72rem', color: 'var(--acc)' }}>View All</Link>
            </div>
            {orders.slice(0, 3).map(order => (
              <div key={order._id} onClick={() => navigate(`/dashboard/orders/${order._id}`)}
                style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 11, padding: '0.875rem', marginBottom: '0.65rem', cursor: 'pointer' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--txt3)' }}>{order.client?.companyName || order.client?.fullName}</span>
                  <Badge color={statusColor(order.status)} style={{ fontSize: '0.62rem' }}>{order.status?.replace('_', ' ')}</Badge>
                </div>
                <ProgressBar value={order.progress || 0} />
              </div>
            ))}

            {orders.length === 0 && (
              <EmptyState icon="📦" title="No active orders" description={isClient ? 'Post a job to get started' : 'Apply to jobs to get orders'} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
