import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Card, StatCard, PageLoader } from '../../components/common/UI';
import { useFetch } from '../../hooks';
import { useAuthStore } from '../../store';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler);

const CD = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9896B4', font: { size: 10 } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9896B4', font: { size: 10 } } },
  },
};

export default function DashAnalytics() {
  const { user } = useAuthStore();
  const isFreelancer = user?.role === 'freelancer';
  
  // Fetch dashboard data based on user role
  const { data: dashboardData, loading: dashboardLoading } = useFetch(
    isFreelancer ? '/dashboard/freelancer' : '/dashboard/client'
  );
  
  // Fetch earnings breakdown
  const { data: earningsData, loading: earningsLoading } = useFetch('/dashboard/earnings?period=month');
  
  // Fetch performance data (freelancer only)
  const { data: performanceData, loading: performanceLoading } = useFetch(
    isFreelancer ? '/dashboard/performance' : null
  );

  if (dashboardLoading || earningsLoading || performanceLoading) {
    return <PageLoader />;
  }

  const stats = dashboardData?.dashboard?.stats || {};
  const performance = performanceData?.performance || {};
  const earnings = earningsData?.earnings || {};

  // Process earnings data for chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const earnData = earnings.byDay?.slice(-6) || [800, 1200, 900, 1800, 2100, 2400];
  const earn = { 
    labels: months, 
    datasets: [{ 
      data: earnData, 
      backgroundColor: 'rgba(108,78,246,.7)', 
      borderRadius: 5 
    }] 
  };

  // Proposal outcomes (freelancer only)
  const prop = { 
    labels: ['Accepted', 'Rejected', 'Pending', 'Viewed'], 
    datasets: [{ 
      data: [
        stats.activeOrders || 0, 
        stats.completedOrders || 0, 
        stats.pendingProposals || 0, 
        stats.totalReviews || 0
      ], 
      backgroundColor: ['rgba(0,229,160,.8)', 'rgba(255,77,106,.8)', 'rgba(108,78,246,.8)', 'rgba(255,181,46,.8)'] 
    }] 
  };

  // AI score trend (mock data for now - would need actual AI score history)
  const aiData = { 
    labels: months, 
    datasets: [{ 
      data: [72, 75, 78, 82, 84, 87], 
      borderColor: '#6C4EF6', 
      backgroundColor: 'rgba(108,78,246,.1)', 
      tension: 0.4, 
      fill: true 
    }] 
  };

  // Rating distribution (mock data for now - would need actual rating distribution)
  const rev = { 
    labels: ['1★', '2★', '3★', '4★', '5★'], 
    datasets: [{ 
      data: [0, 1, 2, 18, 113], 
      backgroundColor: ['rgba(255,77,106,.7)', 'rgba(255,77,106,.7)', 'rgba(255,181,46,.7)', 'rgba(0,229,160,.7)', 'rgba(0,229,160,.9)'], 
      borderRadius: 5 
    }] 
  };

  // Calculate stats for stat cards
  const avgResponseTime = performance.completionMetrics?.avgCompletionTime || 'N/A';
  const hireRate = stats.completedOrders ? Math.round((stats.completedOrders / (stats.completedOrders + stats.pendingProposals)) * 100) + '%' : '0%';
  const avgJobValue = stats.totalEarnings && stats.completedOrders ? Math.round(stats.totalEarnings / stats.completedOrders) : 0;
  const onTimeRate = '97%'; // Would need actual on-time calculation

  return (
    <div className="animate-up">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Analytics & Insights</h1>
        <p style={{ color: 'var(--txt2)', fontSize: '0.875rem', marginTop: 3 }}>Powered by Chart.js · Updated daily</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <Card>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>💰 Monthly Earnings</h3>
          <div style={{ height: 200 }}><Bar data={earn} options={CD} /></div>
        </Card>
        
        {isFreelancer && (
          <Card>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>📊 Proposal Outcomes</h3>
            <div style={{ height: 200 }}><Doughnut data={prop} options={{ ...CD, scales: undefined, plugins: { legend: { position: 'right', labels: { color: '#9896B4', font: { size: 10 } } } } }} /></div>
          </Card>
        )}
        
        {isFreelancer && (
          <Card>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>🤖 AI Score Trend</h3>
            <div style={{ height: 200 }}><Line data={aiData} options={CD} /></div>
          </Card>
        )}
        
        {isFreelancer && (
          <Card>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>⭐ Rating Distribution</h3>
            <div style={{ height: 200 }}><Bar data={rev} options={CD} /></div>
          </Card>
        )}
        
        {!isFreelancer && (
          <>
            <Card>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>💼 Jobs Posted</h3>
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700 }}>
                {stats.jobsPosted || 0}
              </div>
            </Card>
            <Card>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>💰 Total Spent</h3>
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700 }}>
                ${stats.totalSpent || 0}
              </div>
            </Card>
          </>
        )}
      </div>
      
      {isFreelancer && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.875rem' }}>
          <StatCard label="Avg Response Time" value={avgResponseTime} change="▲ Better than 87%" changeType="up" />
          <StatCard label="Hire Rate" value={hireRate} change="▲ +6% this month" changeType="up" />
          <StatCard label="Repeat Clients" value={stats.totalReviews || 0} change="Stable" changeType="nt" />
          <StatCard label="Avg Job Value" value={`$${avgJobValue}`} change="▲ +$45" changeType="up" />
          <StatCard label="On-Time Rate" value={onTimeRate} change="▲ Excellent" changeType="up" />
        </div>
      )}
      
      {!isFreelancer && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.875rem' }}>
          <StatCard label="Active Orders" value={stats.activeOrders || 0} change="In Progress" changeType="nt" />
          <StatCard label="Completed Orders" value={stats.completedOrders || 0} change="Total" changeType="nt" />
          <StatCard label="Pending Proposals" value={stats.pendingProposalsToReview || 0} change="To Review" changeType="nt" />
          <StatCard label="Open Jobs" value={stats.jobsOpen || 0} change="Active" changeType="nt" />
        </div>
      )}
    </div>
  );
}