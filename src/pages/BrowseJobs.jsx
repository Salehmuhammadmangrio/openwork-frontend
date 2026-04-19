import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge, Card, SkillTag, EmptyState, FilterChip, SearchInput } from '../components/common/UI';
import { formatDate, debounce } from '../utils/helpers';
import { useAuthStore } from '../store';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['', 'Web Development', 'Mobile Development', 'UI/UX Design', 'Graphic Design', 'Data Science / AI', 'Content Writing', 'Digital Marketing', 'DevOps & Cloud'];
const CAT_ICONS = { 'Web Development': '💻', 'Mobile Development': '📱', 'UI/UX Design': '🎨', 'Graphic Design': '✏️', 'Data Science / AI': '🤖', 'Content Writing': '✍️', 'Digital Marketing': '📊', 'DevOps & Cloud': '☁️' };

function ApplyModal({ job, onClose, onSuccess }) {
  const [bid, setBid] = useState('');
  const [delivery, setDelivery] = useState('2 weeks');
  const [cover, setCover] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const { user } = useAuthStore();

  const handleAIWrite = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.post(`/ai/proposal/${job._id}`);
      setCover(data.proposal?.generatedText || data.proposal || '');
      setIsAIGenerated(true);
      toast.success('AI proposal generated! ✨');
    } catch {
      toast.error('AI unavailable — try again');
    } finally { setAiLoading(false); }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!bid || !cover.trim()) { toast.error('Bid amount and cover letter are required'); return; }
    if (cover.trim().length < 20) { toast.error('Cover letter must be at least 20 characters'); return; }
    if (parseFloat(bid) <= 0) { toast.error('Bid amount must be greater than 0'); return; }
    if (!delivery.trim()) { toast.error('Delivery time is required'); return; }

    setLoading(true);
    try {
      await api.post(`/proposals/job/${job._id}`, {
        bidAmount: parseFloat(bid),
        deliveryTime: delivery,
        coverLetter: cover,
        isAIGenerated
      });
      toast.success('Proposal submitted! 📝');
      onSuccess?.();
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit proposal';
      toast.error(errMsg);
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <span className="modal-title">Apply for Job</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ background: 'var(--s2)', borderRadius: 10, padding: '.875rem', marginBottom: '1.1rem' }}>
            <div style={{ fontSize: '.875rem', fontWeight: 700 }}>{job.title}</div>
            <div style={{ fontSize: '.72rem', color: 'var(--txt2)', marginTop: 3 }}>{job.client?.companyName || job.client?.fullName} · Budget: ${job.budgetMin}–${job.budgetMax}</div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Your Bid ($) *</label>
                <input className="input" type="number" value={bid} onChange={e => setBid(e.target.value)} placeholder="Enter your rate" min="1" required />
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Time *</label>
                <select className="select" value={delivery} onChange={e => setDelivery(e.target.value)}>
                  {['3 days', '1 week', '2 weeks', '3 weeks', '1 month', '2 months'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.45rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Cover Letter *</label>
                <Button type="button" variant="ghost" size="xs" onClick={handleAIWrite} loading={aiLoading}>
                  🤖 AI Write
                </Button>
              </div>
              <textarea className="textarea" value={cover} onChange={e => setCover(e.target.value)} placeholder="Tell the client why you're the best fit for this job. Be specific about your relevant experience..." style={{ minHeight: 140 }} required />
              <div className="form-hint">{cover.length}/3000 characters</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" variant="primary" full loading={loading}>Submit Proposal →</Button>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function PostJobModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'Web Development', budgetMin: '', budgetMax: '', budgetType: 'fixed', duration: '1 month', experienceLevel: 'any', skills: '', isUrgent: false });
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const budgetMax = form.budgetMax ? parseFloat(form.budgetMax) : 0;
  const hasInsufficientBalance = budgetMax > (user?.walletBalance || 0);
  const shortfall = hasInsufficientBalance ? (budgetMax - (user?.walletBalance || 0)) : 0;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.description) { toast.error('Title and description are required'); return; }
    if (hasInsufficientBalance) { toast.error(`Insufficient wallet balance. Need $${shortfall.toFixed(2)} more.`); return; }
    setLoading(true);
    try {
      await api.post('/jobs', { ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean), budgetMin: +form.budgetMin, budgetMax: +form.budgetMax });
      toast.success('Job posted! AI is matching freelancers 🚀');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <span className="modal-title">Post a New Job</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label className="form-label">Job Title *</label><input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Senior React.js Developer for SaaS Platform" required /></div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Category</label><select className="select" value={form.category} onChange={e => set('category', e.target.value)}>{CATEGORIES.filter(Boolean).map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Budget Type</label><select className="select" value={form.budgetType} onChange={e => set('budgetType', e.target.value)}><option value="fixed">Fixed Price</option><option value="hourly">Hourly Rate</option></select></div>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Min Budget ($)</label><input className="input" type="number" value={form.budgetMin} onChange={e => set('budgetMin', e.target.value)} placeholder="500" min="0" /></div>
              <div className="form-group"><label className="form-label">Max Budget ($)</label><input className="input" type="number" value={form.budgetMax} onChange={e => set('budgetMax', e.target.value)} placeholder="5000" min="0" /></div>
            </div>
            {hasInsufficientBalance && (
              <div style={{ background: 'rgba(255,75,75,.1)', border: '1px solid rgba(255,75,75,.3)', borderRadius: 8, padding: '0.875rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--err)' }}>
                ❌ <strong>Insufficient Wallet Balance</strong><br />
                Budget needed: ${budgetMax.toFixed(2)} | Available: ${(user?.walletBalance || 0).toFixed(2)} | Shortfall: ${shortfall.toFixed(2)}
              </div>
            )}
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Duration</label><select className="select" value={form.duration} onChange={e => set('duration', e.target.value)}>{['< 1 week', '1–2 weeks', '1 month', '2–3 months', '3+ months', 'ongoing'].map(d => <option key={d}>{d}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Experience Level</label><select className="select" value={form.experienceLevel} onChange={e => set('experienceLevel', e.target.value)}><option value="any">Any Level</option><option value="entry">Entry Level</option><option value="mid">Mid Level</option><option value="senior">Senior</option></select></div>
            </div>
            <div className="form-group"><label className="form-label">Description *</label><textarea className="textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe your project requirements, deliverables, and any specific skills needed..." style={{ minHeight: 120 }} required /></div>
            <div className="form-group"><label className="form-label">Required Skills (comma separated)</label><input className="input" value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="React, Node.js, MongoDB, TypeScript..." /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.1rem' }}>
              <input type="checkbox" id="urgent" checked={form.isUrgent} onChange={e => set('isUrgent', e.target.checked)} />
              <label htmlFor="urgent" style={{ fontSize: '.875rem', cursor: 'pointer' }}>🔥 Mark as Urgent</label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" variant="primary" full loading={loading} disabled={hasInsufficientBalance}>Post Job →</Button>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, onApply, onView }) {
  const { isAuthenticated, user } = useAuthStore();
  const icon = CAT_ICONS[job.category] || '💼';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all .25s', minHeight: 220, padding: 18, boxShadow: 'var(--inv-shadow)', borderRadius: 10, background: 'var(--s1)', cursor: 'pointer' }} onClick={() => onView(job)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.875rem', flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '.72rem', color: 'var(--txt3)', marginBottom: 4 }}>{job.client?.companyName || job.client?.fullName || 'Client'}</div>
          <div style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: 6 }}>{job.title}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge variant="teal">{job.category}</Badge>
            {job.isUrgent && <Badge variant="err">🔥 Urgent</Badge>}
            <Badge variant="ok">Open</Badge>
          </div>
        </div>
        <div style={{ fontSize: '1.75rem', marginLeft: 12, flexShrink: 0 }}>{icon}</div>
      </div>

      <p style={{ fontSize: '.82rem', color: 'var(--txt2)', lineHeight: 1.6, marginBottom: '.875rem', flex: 1 }}>
        {job.description?.length > 120 ? job.description.slice(0, 120) + '...' : job.description}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: '.875rem', flexShrink: 0 }}>
        {(job.skills || []).slice(0, 4).map(s => <SkillTag key={s}>{s}</SkillTag>)}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '.875rem', fontSize: '.78rem', color: 'var(--txt3)', flexShrink: 0 }}>
        <span>💰 <strong style={{ color: 'var(--txt)', fontFamily: 'Space Mono, monospace' }}>${job.budgetMin}–${job.budgetMax}</strong></span>
        <span>⏱ {job.duration}</span>
        <span>📋 {job.proposalCount || 0} proposals</span>
        <span>🕐 {formatDate(job.createdAt)}</span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {user?.role === 'freelancer' ? (
          <Button
            variant="primary" size="sm"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await api.get(`/proposals/job/${job._id}`);
                toast.error('You have already submitted a proposal to this job');
              } catch {
                onApply(job);
              }
            }}
          >
            Apply Now →
          </Button>

        ) : isAuthenticated ? (
          <Button variant="ghost" size="sm" disabled style={{ flex: 1 }}>
            Freelancers Only
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); toast.error('Please sign in as freelancer to apply'); }} style={{ flex: 1 }}>
            Sign In
          </Button>
        )}

        <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); onView(job); }}>Details</Button>
      </div>
    </div>
  );
}

export default function BrowseJobs() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [applyJob, setApplyJob] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);

  const fetchJobs = useCallback(async (params) => {
    setLoading(true);
    try {
      const { data } = await api.get('/jobs', { params });
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  }, []);

  const debouncedSearch = useCallback(
    debounce(s => {
      setPage(1);
      fetchJobs({ search: s, category, status: 'open', page: 1, limit: 12 });
    }, 400), [category]
  );

  useEffect(
    () => {
      const params = { status: 'open', page, limit: 12 };
      if (search) params.search = search;
      if (category) params.category = category;
      if (typeFilter === 'urgent') params.isUrgent = true;
      if (typeFilter === 'fixed') params.budgetType = 'fixed';
      if (typeFilter === 'hourly') params.budgetType = 'hourly';
      fetchJobs(params);
    }, [category, typeFilter, page]);

  const handleSearch = e => {
    setSearch(e.target.value); debouncedSearch(e.target.value);
  };

  const filters = [
    { key: 'all', label: 'All Jobs' },
    { key: 'urgent', label: '🔥 Urgent' },
    { key: 'fixed', label: 'Fixed Price' },
    { key: 'hourly', label: 'Hourly' },
  ];

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh' }}>
      <div style={{ background: 'var(--s1)', borderBottom: '1px solid var(--b1)', padding: '2.5rem 1.5rem' }}>
        <div className="container">
          <div className="sec-tag">Open Opportunities</div>
          <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, margin: '.5rem 0' }}>Browse Open Jobs</h1>
          <p style={{ color: 'var(--txt2)', maxWidth: 500 }}>AI-matched opportunities tailored to your verified skills and experience</p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)' }}>🔍</span>
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Search by title, skill, or company..."
              value={search}
              onChange={handleSearch}
            />
          </div>
          <select className="select" style={{ width: 'auto', minWidth: 180 }} value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {CATEGORIES.filter(Boolean).map(c => <option key={c}>{c}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {filters.map(f => (
              <FilterChip key={f.key} label={f.label} active={typeFilter === f.key} onClick={() => { setTypeFilter(f.key); setPage(1); }} />


            ))}
          </div>
          {isAuthenticated && (
            <Button variant="primary" size="sm" onClick={() => setShowPostModal(true)}>+ Post a Job</Button>
          )}
        </div>

        {!loading && <div style={{ fontSize: '.82rem', color: 'var(--txt3)', marginBottom: '1.25rem' }}>Showing {jobs.length} of {total} jobs</div>}

        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : jobs.length === 0 ? (
          <EmptyState icon="💼" title="No jobs found" message="Try different search terms or filters" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {jobs.map(job => (
              <JobCard key={job._id} job={job} onApply={setApplyJob} onView={job => navigate(`/jobs/${job._id}`)} />
            ))}
          </div>
        )}

        {total > 12 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: '2rem' }}>
            <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</Button>
            <span style={{ padding: '6px 16px', fontSize: '.875rem', color: 'var(--txt2)' }}>Page {page} of {Math.ceil(total / 12)}</span>
            <Button variant="ghost" size="sm" disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)}>Next →</Button>
          </div>
        )}
      </div>

      {applyJob && <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} onSuccess={() => fetchJobs({ status: 'open', page, limit: 12 })} />}
      {showPostModal && <PostJobModal onClose={() => setShowPostModal(false)} onSuccess={() => fetchJobs({ status: 'open', page: 1, limit: 12 })} />}
    </div>
  );
}
