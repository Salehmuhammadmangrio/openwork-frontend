// utils/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000, // Increased to 30s for Firebase token verification
  headers: { 'Content-Type': 'application/json' },
});

let isRedirecting = false;

/**
 * Perform complete logout on session expiration
 * Clears all auth-related data from localStorage and state
 */
const handleSessionExpiration = () => {
  if (isRedirecting) return; // Prevent multiple redirects
  isRedirecting = true;

  try {
    // 1. Clear API headers
    delete api.defaults.headers.common.Authorization;
    
    // 2. Clear all auth-related localStorage
    localStorage.removeItem('ow-token');
    localStorage.removeItem('ow-auth'); // Zustand persist key
    localStorage.removeItem('ow-user');
    localStorage.removeItem('authToken');
    
    // 3. Clear sessionStorage
    sessionStorage.clear();
    
    // 4. Show notification
    toast.error('Session expired. Please log in again.', {
      duration: 4000,
      icon: '🔒',
    });
    
    // 5. Redirect to login
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  } catch (error) {

    // Force redirect even if error occurs
    window.location.href = '/login';
  }
};

// ✅ Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ow-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Handle errors safely with automatic logout on session expiration
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || 'Something went wrong';
    const skipAuthRedirect = Boolean(err.config?.meta?.skipAuthRedirect);
    const hadToken = Boolean(err.config?.headers?.Authorization);
    const status = err.response?.status;

    // Session expired or unauthorized (401/403)
    if ((status === 401 || status === 403) && !skipAuthRedirect && hadToken) {
      handleSessionExpiration();
    } else if (status >= 500) {
      toast.error('Server error. Please try again.');
    }

    return Promise.reject(err);
  }
);

export default api;