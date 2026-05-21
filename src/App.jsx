import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore, useNotifStore, useUIStore, useThemeStore } from './store';
import { connectSocket, disconnectSocket, getSocket } from './utils/socket';
import api from './utils/api';
import ErrorBoundary from './components/common/ErrorBoundary';
import { RouteLoadingFallback } from './components/common/RouteLoadingFallback';

// Layout
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import AdminRedirectRoute from './components/common/AdminRedirectRoute';
import ScrollToTop from './components/common/ScrollToTop';

// Public Pages - Lazy loaded for code-splitting
const Landing = React.lazy(() => import('./pages/Landing'));
const AboutUs = React.lazy(() => import('./pages/AboutUs'));
const Careers = React.lazy(() => import('./pages/Careers'));
const Blog = React.lazy(() => import('./pages/Blog'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const Terms = React.lazy(() => import('./pages/Terms'));
const Security = React.lazy(() => import('./pages/Security'));

// Auth Pages - Lazy loaded
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail = React.lazy(() => import('./pages/auth/VerifyEmail'));

// Browse Pages - Lazy loaded
const BrowseFreelancers = React.lazy(() => import('./pages/BrowseFreelancers'));
const BrowseJobs = React.lazy(() => import('./pages/BrowseJobs'));
const BrowseOffers = React.lazy(() => import('./pages/BrowseOffers'));
const FreelancerProfile = React.lazy(() => import('./pages/FreelancerProfile'));
const JobDetail = React.lazy(() => import('./pages/JobDetail'));
import OfferDetail from './pages/OfferDetail';
import ViewProposal from './pages/ViewProposal';
import EditOffer from './pages/EditOffer';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import DashOverview from './pages/dashboard/DashOverview';
import DashOrders from './pages/dashboard/DashOrders';
import DashOrderDetail from './pages/dashboard/DashOrderDetail';
import DeliverOrder from './pages/dashboard/DeliverOrder';
import ReviewDeliveredOrder from './pages/dashboard/ReviewDeliveredOrder';
import DashReviews from './pages/dashboard/DashReviews';
import DashProposals from './pages/dashboard/DashProposals';
import DashReceivedProposals from './pages/dashboard/DashReceivedProposals';
import DashMessages from './pages/dashboard/DashMessages';
import DashSkillTests from './pages/dashboard/DashSkillTests';
import DashProfile from './pages/dashboard/DashProfile';
import DashAnalytics from './pages/dashboard/DashAnalytics';
import DashPayments from './pages/dashboard/DashPayments';
import DashNotifications from './pages/dashboard/DashNotifications';
import DashDisputes from './pages/dashboard/DashDisputes';
import DashSettings from './pages/dashboard/DashSettings';
import DashMilestones from './pages/dashboard/DashMilestones';
import DashMyOffers from './pages/dashboard/DashMyOffers';
import DashMyJobs from './pages/dashboard/DashMyJobs';

// Wallet Pages
import WalletTopupSuccess from './pages/WalletTopupSuccess';
import WalletTopupCancel from './pages/WalletTopupCancel';

// AI Assistant
import AIAssistant from './pages/AIAssistant';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminJobs from './pages/admin/AdminJobs';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminAIRanking from './pages/admin/AdminAIRanking';
import AdminFraud from './pages/admin/AdminFraud';
import AdminReports from './pages/admin/AdminReports';
import AdminLogs from './pages/admin/AdminLogs';

// Checkout
import Checkout from './pages/Checkout';
import CreateOrder from './pages/CreateOrder';

function App() {
  const user = useAuthStore(s => s.user);
  const token = useAuthStore(s => s.token);
  const logout = useAuthStore(s => s.logout);
  const refreshUser = useAuthStore(s => s.refreshUser);
  const { fetch: fetchNotifs, addNew } = useNotifStore();
  const { theme } = useUIStore();
  const { initTheme, mode } = useThemeStore();

  // Initialize theme on mount
  useEffect(() => {
    initTheme();

    //health check 

  }, []);

  // Restore axios token on mount and verify session validity
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Verify token is still valid by refreshing user data
      // Only call once on initial mount to avoid rate limiting
      const validateSession = async () => {
        try {
          await refreshUser();
        } catch (err) {
          // The API interceptor and refreshUser will handle logout
        }
      };

      validateSession();
    }
  }, [token]);

  // Socket.io setup - only connect when user exists and is authenticated
  // Disconnect when user logs out
  useEffect(() => {
    // Only initialize socket if user is fully authenticated
    if (!user?._id) {
      // If user was logged in but now isn't, disconnect any existing socket
      disconnectSocket();
      return;
    }

    const socket = connectSocket(user._id);

    // Remove any existing listeners first to prevent duplicates
    socket.off('notification:new');
    socket.off('logout');

    // Listen for new notifications
    socket.on('notification:new', (notif) => {
      addNew(notif);
    });

    // Listen for logout event from server (e.g., admin forced logout)
    socket.on('logout', (data) => {
      // Disconnect socket first, then logout
      disconnectSocket();
      logout();
    });

    fetchNotifs();

    // Cleanup on unmount or when user changes
    return () => {
      socket.off('notification:new');
      socket.off('logout');
      disconnectSocket();
    };
  }, [user?._id]); // Only re-run when user ID changes

  useEffect(() => {
    document.body.classList.toggle('theme-light', theme === 'light');
    document.documentElement.classList.toggle('theme-light', theme === 'light');
  }, [theme, mode]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: theme === 'light' ? '#FFFFFF' : '#1E1E2D',
              color: theme === 'light' ? '#1E2030' : '#F0EFF8',
              border: theme === 'light' ? '1px solid rgba(17,24,39,0.12)' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#00B894', secondary: theme === 'light' ? '#FFFFFF' : '#1E1E2D' } },
            error: { iconTheme: { primary: '#FF4D6A', secondary: theme === 'light' ? '#FFFFFF' : '#1E1E2D' } },
          }}
        />

        <Routes >
          {/* Public */}
          <Route path="/" element={
            <AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><Landing /></Suspense></AdminRedirectRoute>} />
          <Route path="/about" element={<AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><AboutUs /></Suspense></AdminRedirectRoute>} />
          <Route path="/careers" element={<AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><Careers /></Suspense></AdminRedirectRoute>} />
          <Route path="/blog" element={<AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><Blog /></Suspense></AdminRedirectRoute>} />
          <Route path="/privacy" element={<AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><PrivacyPolicy /></Suspense></AdminRedirectRoute>} />
          <Route path="/terms" element={<AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><Terms /></Suspense></AdminRedirectRoute>} />
          <Route path="/security" element={<AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><Security /></Suspense></AdminRedirectRoute>} />
          <Route path="/login" element={<AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><Login /></Suspense></AdminRedirectRoute>} />
          <Route path="/register" element={<AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><Register /></Suspense></AdminRedirectRoute>} />
          <Route path="/forgot-password" element={<AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><ForgotPassword /></Suspense></AdminRedirectRoute>} />
          <Route path="/reset-password/:token" element={<AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><ResetPassword /></Suspense></AdminRedirectRoute>} />
          <Route path="/verify-email" element={<AdminRedirectRoute><ProtectedRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><VerifyEmail /></Suspense></ProtectedRoute></AdminRedirectRoute>} />

          {/* Browse (public with optional auth) */}
          <Route path="/freelancers" element={<AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><BrowseFreelancers /></Suspense></AdminRedirectRoute>} />
          <Route path="/freelancers/:id" element={<AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><FreelancerProfile /></Suspense></AdminRedirectRoute>} />
          <Route path="/jobs" element={<AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><BrowseJobs /></Suspense></AdminRedirectRoute>} />
          <Route path="/jobs/:id" element={<AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><JobDetail /></Suspense></AdminRedirectRoute>} />
          <Route path="/proposals/:id" element={<AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><ViewProposal /></Suspense></AdminRedirectRoute>} />
          <Route path="/offers" element={<AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><BrowseOffers /></Suspense></AdminRedirectRoute>} />
          <Route path="/offers/:id" element={<AdminRedirectRoute><Navbar /><Suspense fallback={<RouteLoadingFallback />}><OfferDetail /></Suspense></AdminRedirectRoute>} />
          <Route path="/offers/:id/edit" element={
            <AdminRedirectRoute>
              <ProtectedRoute>
                <Navbar />
                <EditOffer />
              </ProtectedRoute>
            </AdminRedirectRoute>
          } />

          {/* AI Assistant */}


          {/* Checkout */}
          <Route path="/checkout" element={
            <AdminRedirectRoute>
              <ProtectedRoute>
                <Navbar />
                <Checkout />
              </ProtectedRoute>
            </AdminRedirectRoute>
          } />



          {/* Dashboard */}
          <Route path="/dashboard"
            element={
              <AdminRedirectRoute>
                <ProtectedRoute>
                  <Navbar />
                  <Dashboard />
                </ProtectedRoute>
              </AdminRedirectRoute>
            }

          >

            <Route index element={<DashOverview />} />
            {/* Create Order */}
            <Route path="create-order" element={
              <ProtectedRoute>
                <Navbar />
                <CreateOrder />
              </ProtectedRoute>
            } />
            <Route path="create-order/:offerId" element={
              <ProtectedRoute>
                <Navbar />
                <CreateOrder />
              </ProtectedRoute>
            } />
            <Route path="orders" element={<DashOrders />} />
            <Route path="orders/:id" element={<DashOrderDetail />} />
            <Route path="orders/:id/deliver" element={<DeliverOrder />} />
            <Route path="orders/:id/review" element={<ReviewDeliveredOrder />} />
            <Route path="reviews" element={<DashReviews />} />
            <Route path="proposals" element={<DashProposals />} />
            <Route path="received-proposals" element={<DashReceivedProposals />} />
            <Route path="messages" element={<DashMessages />} />
            <Route path="messages/:conversationId" element={<DashMessages />} />
            <Route path="skill-tests" element={<DashSkillTests />} />
            <Route path="profile" element={<DashProfile />} />
            <Route path="analytics" element={<DashAnalytics />} />
            <Route path="payments" element={<DashPayments />} />
            <Route path="notifications" element={<DashNotifications />} />
            <Route path="disputes" element={<DashDisputes />} />
            <Route path="settings" element={<DashSettings />} />
            <Route path="milestones" element={<DashMilestones />} />
            <Route path="my-offers" element={<DashMyOffers />} />

            <Route path="ai" element={
              <ProtectedRoute>
                <Navbar />
                <AIAssistant />
              </ProtectedRoute>}
            />
            <Route path="my-jobs" element={<DashMyJobs />} />
          </Route>

          {/* Admin */}
          <Route path="/admin"
            element={
              <AdminRoute>
                <Navbar />
                <AdminLayout />
              </AdminRoute>}
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="jobs" element={<AdminJobs />} />
            <Route path="disputes" element={<AdminDisputes />} />
            <Route path="ai-ranking" element={<AdminAIRanking />} />
            <Route path="fraud" element={<AdminFraud />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="logs" element={<AdminLogs />} />
          </Route>

          {/* Wallet Pages */}
          <Route path="/wallet/topup/success" element={
            <ProtectedRoute>
              <WalletTopupSuccess />
            </ProtectedRoute>
          } />
          <Route path="/wallet/topup/cancel" element={
            <ProtectedRoute>
              <WalletTopupCancel />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
