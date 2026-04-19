// hooks/index.js
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import { debounce } from '../utils/helpers';

// ─── useFetch: generic data fetching ─────────────────────────
export const useFetch = (url, params = {}, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url, { params });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(params), ...deps]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
};

// ─── useInfiniteScroll ────────────────────────────────────────
export const useInfiniteScroll = (url, limit = 12) => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async (reset = false, extraParams = {}) => {
    if (loading) return;
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const { data } = await api.get(url, { params: { page: currentPage, limit, ...extraParams } });
      const newItems = data.jobs || data.offers || data.freelancers || data.users || [];
      setItems(reset ? newItems : prev => [...prev, ...newItems]);
      setHasMore(newItems.length === limit);
      if (!reset) setPage(p => p + 1);
      else setPage(2);
    } catch { }
    finally { setLoading(false); }
  }, [url, page, limit, loading]);

  useEffect(() => { loadMore(true); }, [url]);
  return { items, loading, hasMore, loadMore: () => loadMore(false), reload: (p) => loadMore(true, p) };
};

// ─── useDebounceSearch ────────────────────────────────────────
export const useDebounceSearch = (initialValue = '', delay = 350) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return [value, debouncedValue, setValue];
};

// ─── useLocalStorage ─────────────────────────────────────────
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch { return initialValue; }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch { }
  };
  return [storedValue, setValue];
};

// ─── useOutsideClick ─────────────────────────────────────────
export const useOutsideClick = (callback) => {
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) callback(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [callback]);
  return ref;
};

// ─── useForm ─────────────────────────────────────────────────
export const useForm = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues(v => ({ ...v, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(er => { const n = { ...er }; delete n[name]; return n; });
  };

  const setField = (name, value) => setValues(v => ({ ...v, [name]: value }));

  const reset = () => { setValues(initialValues); setErrors({}); };

  return { values, errors, submitting, setSubmitting, handleChange, setField, setErrors, reset, setValues };
};

// ─── useWindowSize ────────────────────────────────────────────
export const useWindowSize = () => {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
};

// ─── useAI: AI-powered features ─────────────────────────────
export { default as useAI } from './useAI';
