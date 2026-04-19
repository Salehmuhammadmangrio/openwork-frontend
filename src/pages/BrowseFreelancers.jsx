import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge, Avatar, SkillTag, PageLoader, EmptyState } from '../components/common/UI';
import { formatCurrency, debounce, getAvatarGradient, getInitials } from '../utils/helpers';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store';

const CATEGORIES = [
  '', 'Web Development', 'Mobile Development', 'UI/UX Design',
  'Graphic Design', 'Data Science / AI', 'Content Writing',
  'Digital Marketing', 'DevOps & Cloud', 'Cybersecurity',
];

const SORT_OPTIONS = [
  { value: 'ai', label: 'AI Score ↓' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'rate', label: 'Lowest Rate' },
  { value: 'completed', label: 'Most Jobs Done' },
];

function AIScoreBar({ score }) {
  const color = score >= 90 ? 'var(--ok)' : score >= 75 ? 'var(--acc2)' : 'var(--warn)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,229,195,.05)', border: '1px solid rgba(0,229,195,.12)', borderRadius: 8, padding: '7px 10px', marginTop: '.75rem' }}>
      <div style={{ width: 16, height: 16, background: 'var(--g1)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, flexShrink: 0 }}>🤖</div>
      <span style={{ fontSize: '.68rem', color: 'var(--txt2)', flex: 1 }}>AI Score</span>
      <div style={{ width: 70, height: 4, background: 'var(--s3)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '.68rem', color, fontWeight: 700, minWidth: 24, textAlign: 'right' }}>{score}</span>
    </div>
  );
}

function FreelancerCard({ fl, onHire }) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const grad = fl.profileImage ? undefined : getAvatarGradient(fl._id);
  
  const canHire = isAuthenticated && (user?.role === 'client' || user?.canActAsClient || user?.role === 'admin');

  return (
    <div
      className="card"
      style={{ cursor: 'pointer', transition: 'all .25s', padding: '1.5rem', position: 'relative', padding: 18, boxShadow: '0 3px 3px 4px rgba(0,0,0,0.1)', borderRadius: 10, background: 'var(--s1)', }}
      onClick={() => navigate(`/freelancers/${fl._id}`)}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(108,78,246,.35)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Avatar name={fl.fullName} image={fl.profileImage} id={fl._id} size={50} radius={13} style={{ marginBottom: '.875rem' }} />
          <div style={{ fontSize: '.95rem', fontWeight: 700 }}>{fl.fullName}</div>
          <div style={{ fontSize: '.78rem', color: 'var(--txt2)', marginTop: 2 }}>{fl.title || 'Freelancer'}</div>
          <div style={{ fontSize: '.72rem', color: 'var(--txt3)', marginTop: 2 }}>📍 {fl.location || 'Remote'}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.875rem', fontWeight: 700, color: 'var(--acc2)' }}>
            {fl.hourlyRate ? `$${fl.hourlyRate}/hr` : 'Rate TBD'}
          </div>
          <div style={{ fontSize: '.72rem', color: 'var(--txt2)', marginTop: 3 }}>
            ⭐ {fl.averageRating?.toFixed(1) || '—'} ({fl.totalReviews || 0})
          </div>
          <div style={{ fontSize: '.68rem', color: 'var(--txt3)', marginTop: 2 }}>{fl.completedJobs || 0} jobs done</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, margin: '.875rem 0' }}>
        {(fl.skills || []).slice(0, 4).map(s => <SkillTag key={s}>{s}</SkillTag>)}
        {(fl.skills || []).length > 4 && (
          <span style={{ fontSize: '.7rem', color: 'var(--txt3)', padding: '3px 9px', display: 'flex', alignItems: 'center' }}>+{fl.skills.length - 4}</span>
        )}
      </div>

      <div style={{ paddingBottom: '40px' }}>
        <AIScoreBar score={fl.aiSkillScore || 0} />
      </div>

      {/* Position fixed in bottom of card */}
      <div style={{ display: 'flex', gap: 6, marginTop: '.875rem', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', bottom: "16px", width: "calc(100% - 32px)" }}>
        {canHire ? (
          <Button
            variant="primary" size="sm"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={e => { e.stopPropagation(); onHire(fl); }}
          >
            Hire Now
          </Button>
        ) : (
          <Button
            variant="ghost" size="sm"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={e => {
              e.stopPropagation();
              if (!isAuthenticated) {
                toast.error('Please sign in to hire freelancers');
              } else {
                toast.error('Only clients can hire freelancers');
              }
            }}
          >
            {isAuthenticated ? 'Clients Only' : 'Sign In to Hire'}
          </Button>
        )}
        <Button
          variant="ghost" size="sm"
          onClick={e => { e.stopPropagation(); navigate(`/freelancers/${fl._id}`); }}
        >
          Profile
        </Button>
      </div>
    </div>
  );
}

function HireModal({ freelancer, onClose }) {
  const [desc, setDesc] = useState('');
  const [budget, setBudget] = useState('');
  const [duration, setDuration] = useState('1 month');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!desc.trim() || !budget) { toast.error('Please fill all required fields'); return; }
    setLoading(true);
    try {
      await api.post('/orders', {
        freelancerId: freelancer._id,
        title: `Project with ${freelancer.fullName}`,
        totalAmount: parseFloat(budget),
        description: desc,
      });
      toast.success(`Offer sent to ${freelancer.fullName}! 🚀`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Hire {freelancer.fullName}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--s2)', borderRadius: 10, padding: '.875rem', marginBottom: '1.1rem' }}>
            <Avatar name={freelancer.fullName} id={freelancer._id} size={44} radius={12} />
            <div>
              <div style={{ fontSize: '.9rem', fontWeight: 700 }}>{freelancer.fullName}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--txt2)' }}>{freelancer.title} · ${freelancer.hourlyRate}/hr · ⭐{freelancer.averageRating?.toFixed(1)}</div>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Project Description *</label>
              <textarea className="textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe the work you need done, deliverables, timeline..." rows={4} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Budget ($) *</label>
                <input className="input" type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 1000" min="10" required />
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <select className="select" value={duration} onChange={e => setDuration(e.target.value)}>
                  {['< 1 week', '1–2 weeks', '1 month', '2–3 months', '3+ months'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" variant="primary" full loading={loading}>Send Offer →</Button>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function BrowseFreelancers() {
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('ai');
  const [page, setPage] = useState(1);
  const [hireTarget, setHireTarget] = useState(null);

  const fetchFreelancers = useCallback(async (params) => {
    setLoading(true);
    try {
      const { data } = await api.get('/users/freelancers', { params });
      setFreelancers(data.freelancers || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load freelancers'); }
    finally { setLoading(false); }
  }, []);

  const debouncedSearch = useCallback(debounce((s) => {
    setPage(1);
    fetchFreelancers({ search: s, category, sort, page: 1, limit: 12 });
  }, 400), [category, sort]);

  useEffect(() => {
    fetchFreelancers({ search, category, sort, page, limit: 12 });
  }, [category, sort, page]);

  const handleSearch = e => {
    setSearch(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'var(--s1)', borderBottom: '1px solid var(--b1)', padding: '2.5rem 1.5rem' }}>
        <div className="container">
          <div className="sec-tag">Talent Pool</div>
          <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, margin: '.5rem 0' }}>Find Expert Freelancers</h1>
          <p style={{ color: 'var(--txt2)', maxWidth: 500 }}>AI-verified professionals with certified skill scores ready to power your next project</p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)' }}>🔍</span>
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Search by name, skill, or title..."
              value={search}
              onChange={handleSearch}
            />
          </div>
          <select className="select" style={{ width: 'auto', minWidth: 180 }} value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {CATEGORIES.filter(Boolean).map(c => <option key={c}>{c}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            {SORT_OPTIONS.map(o => (
              <button key={o.value} className={`fchip${sort === o.value ? ' active' : ''}`} onClick={() => { setSort(o.value); setPage(1); }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <div style={{ fontSize: '.82rem', color: 'var(--txt3)', marginBottom: '1.25rem' }}>
            Showing {freelancers.length} of {total} freelancers
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : freelancers.length === 0 ? (
          <EmptyState icon="🔍" title="No freelancers found" message="Try adjusting your search or filters" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {freelancers.map(fl => (
              <FreelancerCard key={fl._id} fl={fl} onHire={setHireTarget} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 12 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: '2rem' }}>
            <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</Button>
            <span style={{ padding: '6px 16px', fontSize: '.875rem', color: 'var(--txt2)' }}>Page {page} of {Math.ceil(total / 12)}</span>
            <Button variant="ghost" size="sm" disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)}>Next →</Button>
          </div>
        )}
      </div>

      {hireTarget && <HireModal freelancer={hireTarget} onClose={() => setHireTarget(null)} />}
    </div>
  );
}
