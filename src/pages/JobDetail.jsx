import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Button, Badge, SkillTag, Avatar, EmptyState, PageLoader } from '../components/common/UI';
import { formatDate, formatCurrency, getAvatarGradient } from '../utils/helpers';
import { useAuthStore } from '../store';
import api from '../utils/api';
import aiService from '../utils/aiService';
import toast from 'react-hot-toast';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);


export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [job, setJob] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [bid, setBid] = useState('');
  const [delivery, setDelivery] = useState('2 weeks');
  const [cover, setCover] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/jobs/${id}`);
        setJob(data.job);
        // Note: AI job-match requires a specific job context, not just freelancer ID
        // This will be used when viewing a specific job listing instead
      } catch { toast.error('Job not found'); navigate('/jobs'); }
      finally { setLoading(false); }
    };
    load();
  }, [id, isAuthenticated]);

  const handleAIProposal = async () => {
    setAiLoading(true);
    try {
      const data = await aiService.generateProposal(id);
      setCover(data.proposal?.generatedText || data.proposal || '');
      toast.success('AI proposal ready! ✨');
    } catch { toast.error('AI unavailable'); } finally { setAiLoading(false); }
  };

  const handleApply = async e => {
    e.preventDefault();
    if (!bid || !cover.trim()) { toast.error('Please fill all fields'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.get(`/proposals/job/${id}/check`);
      if (data.hasApplied) {
        toast.error('Already applied to this job');
        return;
      }
      await api.post(`/proposals/job/${id}`, { bidAmount: +bid, deliveryTime: delivery, coverLetter: cover });
      toast.success('Proposal submitted! 📝'); setShowApply(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <PageLoader />;
  if (!job) return null;

  const CAT_ICONS = { 'Web Development': '💻', 'UI/UX Design': '🎨', 'Data Science / AI': '🤖', 'Mobile Development': '📱', 'Content Writing': '✍️' };

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 2rem' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')} style={{ marginBottom: '2rem' }}>← Back to Jobs</Button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem', alignItems: 'start' }}>
          <div>
            {/* Header Section */}
            <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.765rem', color: 'var(--txt3)', marginBottom: '.75rem', fontWeight: 600 }}>
                    {job.client?.companyName || job.client?.fullName} · Posted {formatDate(job.createdAt)}
                  </div>
                  <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.3 }}>{job.title}</h1>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Badge variant="teal">{job.category}</Badge>
                    <Badge variant="ok">Open</Badge>
                    {job.isUrgent && <Badge variant="err">🔥 Urgent</Badge>}
                    <Badge variant="info">{job.experienceLevel} level</Badge>
                  </div>
                </div>
                {isAuthenticated && user?.role === 'freelancer' && (
                  <Button variant="primary" size="lg" onClick={async () => {
                    try {
                      const { data } = await api.get(`/proposals/job/${id}/check`);
                      if (data.hasApplied) {
                        toast('Already applied to this job');
                      } else {
                        setShowApply(true);
                      }
                    } catch {
                      setShowApply(true);
                    }
                  }} style={{ height: 48, fontSize: '.95rem' }}>Apply Now →</Button>
                )}

              </div>

              {/* Quick Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {[['Budget', `$${job.budgetMin}–$${job.budgetMax}`, 'acc2'], ['Duration', job.duration, 'txt'], ['Proposals', `${job.proposalCount}`, 'txt']].map(([l, v, c]) => (
                  <div key={l} style={{ background: 'var(--s2)', borderRadius: 11, padding: '1rem', border: '1px solid var(--b1)' }}>
                    <div style={{ fontSize: '.72rem', color: 'var(--txt3)', marginBottom: '.5rem' }}>{l}</div>
                    <div style={{ fontSize: c !== 'txt' ? '1.1rem' : '.95rem', fontWeight: 700, ...(c !== 'txt' ? { color: `var(--${c})`, fontFamily: 'Space Mono, monospace' } : { color: 'var(--txt)' }) }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Description */}
            <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Project Description</h3>
              <p style={{ fontSize: '.925rem', color: 'var(--txt2)', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 0 }}>{job.description}</p>
            </div>

            {/* Required Skills */}
            <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Required Skills</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(job.skills || []).map(s => <SkillTag key={s}>{s}</SkillTag>)}
              </div>
            </div>

            {/* AI Match Section */}
            {match && (
              <div className="card" style={{ marginBottom: '2rem', padding: '2rem', background: 'rgba(108,78,246,.05)', borderColor: 'rgba(108,78,246,.2)', border: '1.5px solid rgba(108,78,246,.2)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>🤖 Your AI Match Score</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <div className="prog-bar">
                      <div className="prog-fill" style={{ width: `${match.matchScore}%`, background: match.matchScore > 75 ? 'var(--ok)' : 'var(--warn)' }} />
                    </div>
                  </div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '1.75rem', fontWeight: 700, color: match.matchScore > 75 ? 'var(--ok)' : 'var(--warn)', minWidth: 60, textAlign: 'right' }}>{match.matchScore}%</div>
                </div>
                <div style={{ display: 'flex', gap: '2rem', fontSize: '.85rem' }}>
                  <div>
                    <div style={{ color: 'var(--txt2)', marginBottom: '.25rem' }}>Skill Match</div>
                    <div style={{ color: 'var(--txt)', fontWeight: 700, fontSize: '.95rem' }}>{match.breakdown?.skillMatch}%</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--txt2)', marginBottom: '.25rem' }}>AI Score</div>
                    <div style={{ color: 'var(--txt)', fontWeight: 700, fontSize: '.95rem' }}>{match.breakdown?.aiScore}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: 90 }}>
            {/* Client Card */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
              <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '1rem' }}>About the Client</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
                <Avatar name={job.client?.fullName} id={job.client?._id} size={44} radius={12} />
                <div>
                  <div style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--txt)' }}>{job.client?.companyName || job.client?.fullName}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--txt3)', marginTop: 2 }}>{job.client?.organizationType || 'Client'}</div>
                </div>
              </div>
              {[['Total Spent', formatCurrency(job.client?.totalSpent || 0)], ['Rating', `⭐ ${job.client?.averageRating?.toFixed(1) || '—'}`]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', padding: '8px 0', borderBottom: '1px solid var(--b1)' }}>
                  <span style={{ color: 'var(--txt2)' }}>{l}</span>
                  <span style={{ fontWeight: 700, color: 'var(--txt)' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Apply Button */}
            {isAuthenticated && user?.role === 'freelancer' && (
              <Button variant="primary" full size="lg" onClick={() => setShowApply(true)} style={{ height: 48, fontSize: '.95rem', marginBottom: '1rem' }}>Apply for this Job →</Button>
            )}
            {!isAuthenticated && (
              <Button variant="ghost" full size="lg" onClick={() => navigate('/login')}>Sign in to Apply</Button>
            )}
          </div>
        </div>
      </div>

      {showApply && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowApply(false)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header"><span className="modal-title">Submit Proposal</span><button className="modal-close" onClick={() => setShowApply(false)}>✕</button></div>
            <div className="modal-body">
              <form onSubmit={handleApply}>
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Your Bid ($) *</label><input className="input" type="number" value={bid} onChange={e => setBid(e.target.value)} placeholder="Enter amount" required /></div>
                  <div className="form-group"><label className="form-label">Delivery Time *</label><select className="select" value={delivery} onChange={e => setDelivery(e.target.value)}>{['3 days', '1 week', '2 weeks', '3 weeks', '1 month', '2 months'].map(d => <option key={d}>{d}</option>)}</select></div>
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.45rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Cover Letter *</label>
                    <Button type="button" variant="ghost" size="xs" onClick={handleAIProposal} loading={aiLoading}>🤖 AI Write</Button>
                  </div>
                  <textarea className="textarea" value={cover} onChange={e => setCover(e.target.value)} placeholder="Why are you the best fit for this project?" style={{ minHeight: 140 }} required />
                </div>
                <div style={{ display: 'flex', gap: 8 }}><Button type="submit" variant="primary" full loading={submitting}>Submit Proposal →</Button><Button type="button" variant="ghost" onClick={() => setShowApply(false)}>Cancel</Button></div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}