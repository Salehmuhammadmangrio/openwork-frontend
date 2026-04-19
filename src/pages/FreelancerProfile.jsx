// ============================================================
// pages/FreelancerProfile.jsx
// ============================================================
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Button, Badge, SkillTag, Avatar, EmptyState, PageLoader } from '../components/common/UI';
import { formatDate, formatCurrency, getAvatarGradient } from '../utils/helpers';
import { useAuthStore } from '../store';
import api from '../utils/api';
import toast from 'react-hot-toast';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export function FreelancerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [fl, setFl] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHire, setShowHire] = useState(false);
  const [tab, setTab] = useState('about');

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, rRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/reviews/user/${id}`),
        ]);
        setFl(uRes.data.user);
        setReviews(rRes.data.reviews || []);
      } catch { toast.error('Failed to load profile'); navigate('/freelancers'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return <PageLoader />;
  if (!fl) return null;

  const grad = getAvatarGradient(fl._id);
  const radarData = {
    labels: ['Problem Solving', 'Code Quality', 'Communication', 'Delivery Speed', 'Testing'],
    datasets: [{
      data: [fl.aiSkillScore - 5, fl.aiSkillScore, fl.aiSkillScore - 8, fl.aiSkillScore - 3, fl.aiSkillScore - 12].map(v => Math.max(0, Math.min(100, v))),
      backgroundColor: 'rgba(108,78,246,.15)',
      borderColor: '#6C4EF6',
      pointBackgroundColor: '#6C4EF6',
    }],
  };

  const tabs = [{ key: 'about', label: 'About' }, { key: 'reviews', label: `Reviews (${reviews.length})` }, { key: 'ai', label: 'AI Score' }];

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh' }}>
      {/* Banner */}
      <div style={{ position: 'relative', marginBottom: '3rem' }}>
        <div style={{ height: 200, background: `linear-gradient(135deg, rgba(108,78,246,.3), rgba(0,229,195,.2))` }} />
        <div className="container" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: -40, left: '1.5rem', display: 'flex', alignItems: 'flex-end', gap: 16 }}>
            <div style={{ width: 90, height: 90, borderRadius: 22, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontSize: '2rem', fontWeight: 800, color: '#fff', border: '4px solid var(--bg)', flexShrink: 0 }}>
              {fl.profileImage ? <img src={fl.profileImage} alt={fl.fullName} style={{ width: '100%', height: '100%', borderRadius: 18, objectFit: 'cover' }} /> : fl.fullName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '3rem 1.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.75rem', alignItems: 'start' }}>
          {/* Main */}
          <div>
            <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, padding: '1.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{fl.fullName}</h1>
                  <p style={{ color: 'var(--txt2)', marginTop: 4 }}>{fl.title || 'Freelancer'} · 📍 {fl.location || 'Remote'}</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: '.75rem', flexWrap: 'wrap' }}>
                    {fl.isVerified && <Badge variant="ok">✓ Verified</Badge>}
                    {fl.aiSkillScore > 0 && <Badge variant="teal">🤖 AI Certified</Badge>}
                    <Badge variant="info">{fl.experienceLevel || 'mid'} level</Badge>
                    <Badge variant={fl.availability === 'available' ? 'ok' : 'warn'}>{fl.availability || 'available'}</Badge>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.875rem', flexWrap: 'wrap' }}>
                  {[['$' + (fl.hourlyRate || 0) + '/hr', 'Rate'], ['⭐ ' + (fl.averageRating?.toFixed(1) || '—'), 'Rating'], [(fl.completedJobs || 0) + '', 'Jobs Done'], [(fl.aiSkillScore || 0) + '', 'AI Score']].map(([v, l]) => (
                    <div key={l} style={{ textAlign: 'center', background: 'var(--s2)', borderRadius: 11, padding: '.875rem 1.1rem' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'Syne,sans-serif' }}>{v}</div>
                      <div style={{ fontSize: '.68rem', color: 'var(--txt3)', marginTop: 2 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: '1.25rem' }}>
              {tabs.map(t => <button style={{ padding: '0.55rem 1rem', margin: '.10rem', borderRadius: '10px' }} key={t.key} className={`tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>)}
            </div>

            {tab === 'about' && (
              <div>
                <div className="card" style={{ marginBottom: '1.25rem', padding: '1.175rem' }}>
                  <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '.75rem' }}>About</h3>
                  <p style={{ fontSize: '.875rem', color: 'var(--txt2)', lineHeight: 1.7 }}>{fl.bio || 'No bio provided yet.'}</p>
                </div>
                <div className="card" style={{ marginBottom: '1.25rem', padding: '1.175rem' }}>
                  <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '.75rem' }}>Skills</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(fl.skills || []).map(s => <SkillTag key={s}>{s}</SkillTag>)}
                    {!fl.skills?.length && <span style={{ color: 'var(--txt3)', fontSize: '.875rem' }}>No skills listed</span>}
                  </div>
                </div>
                {fl.certifications?.length > 0 && (
                  <div className="card">
                    <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '.75rem' }}>Certifications</h3>
                    {fl.certifications.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '.75rem 0', borderBottom: '1px solid var(--b1)' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(0,229,160,.1)', border: '1px solid rgba(0,229,160,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🏆</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '.875rem', fontWeight: 700 }}>{c.skill}</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--txt3)' }}>{c.score}/{c.total} · {formatDate(c.takenAt)}</div>
                        </div>
                        <Badge variant={c.passed ? 'ok' : 'warn'}>{c.passed ? 'Certified' : 'Failed'}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Card - Only show when NOT on reviews tab */}
            {tab !== 'reviews' && (
              <div style={{ marginTop: '2rem' }}>
                <div className="card" style={{ marginBottom: '1.25rem', padding: '1.175rem', background: 'var(--s1)', borderLeft: '4px solid var(--acc)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '.95rem', fontWeight: 700 }}>⭐ Client Reviews ({reviews.length})</h3>
                    {reviews.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <span style={{ color: 'var(--warn)', fontSize: '1.2rem', letterSpacing: 1 }}>{'★'.repeat(Math.round(fl.averageRating || 0))}{'☆'.repeat(5 - Math.round(fl.averageRating || 0))}</span>
                        <span style={{ fontSize: '.85rem', fontWeight: 700 }}>{fl.averageRating?.toFixed(1) || '—'}/5.0</span>
                      </div>
                    )}
                  </div>

                  {reviews.length === 0 ? (
                    <p style={{ fontSize: '.875rem', color: 'var(--txt3)', textAlign: 'center', padding: '1.5rem 0' }}>No reviews yet. This freelancer is building their reputation.</p>
                  ) : (
                    <div>
                      {reviews.slice(0, 2).map(r => (
                        <div key={r._id} style={{ marginBottom: '.875rem', paddingBottom: '.875rem', borderBottom: reviews.indexOf(r) < 1 ? '1px solid var(--b1)' : 'none' }}>
                          {/* Reviewer Info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '.5rem' }}>
                            <Avatar name={r.reviewer?.fullName} id={r.reviewer?._id} size={28} radius="50%" />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '.8rem', fontWeight: 700 }}>{r.reviewer?.fullName}</div>
                              <div style={{ fontSize: '.65rem', color: 'var(--txt3)' }}>{formatDate(r.createdAt)}</div>
                            </div>
                            <div style={{ color: 'var(--warn)', fontSize: '.95rem', letterSpacing: 1 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                          </div>
                          {/* Comment */}
                          <p style={{ fontSize: '.8rem', color: 'var(--txt2)', lineHeight: 1.5, margin: '0.35rem 0 0 0' }}>{r.comment?.substring(0, 120)}...</p>
                        </div>
                      ))}
                      {reviews.length > 2 && (
                        <button onClick={() => setTab('reviews')} style={{ fontSize: '.8rem', color: 'var(--acc)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '.5rem 0' }}>
                          View all {reviews.length} reviews →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'reviews' && (
              <div>
                {reviews.length === 0 ? (
                  <EmptyState icon="⭐" title="No reviews yet" message="This freelancer hasn't received any reviews" />
                ) : (
                  <div>
                    {/* Rating Summary Card */}
                    <div className="card" style={{ marginBottom: '2rem', padding: '2rem', background: 'linear-gradient(135deg, rgba(108,78,246,.08), rgba(0,229,195,.08))', border: '1px solid rgba(108,78,246,.15)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
                        {/* Left: Average Rating */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'Space Mono,monospace', color: 'var(--acc)', marginBottom: '.5rem' }}>{fl.averageRating?.toFixed(1) || '—'}</div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
                            {[...Array(5)].map((_, i) => (
                              <span key={i} style={{ fontSize: '1.5rem', color: i < Math.round(fl.averageRating || 0) ? 'var(--warn)' : 'var(--s3)' }}>★</span>
                            ))}
                          </div>
                          <div style={{ fontSize: '.875rem', color: 'var(--txt2)' }}>Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
                        </div>

                        {/* Right: Rating Breakdown */}
                        <div>
                          {[5, 4, 3, 2, 1].map(rating => {
                            const count = reviews.filter(r => r.rating === rating).length;
                            const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                            return (
                              <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' }}>
                                <div style={{ display: 'flex', gap: '.25rem', width: 60, fontSize: '.8rem' }}>
                                  <span style={{ fontWeight: 600 }}>{rating}</span>
                                  <span style={{ color: 'var(--warn)' }}>★</span>
                                </div>
                                <div style={{ flex: 1, height: 8, background: 'var(--s2)', borderRadius: 4, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', background: rating >= 4 ? 'var(--ok)' : rating >= 3 ? 'var(--warn)' : 'var(--err)', width: `${percent}%`, transition: 'width .2s' }} />
                                </div>
                                <div style={{ fontSize: '.75rem', color: 'var(--txt3)', width: 35, textAlign: 'right' }}>{count} ({Math.round(percent)}%)</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Reviews List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {reviews.map(r => (
                        <div key={r._id} className="card" style={{ padding: '1.75rem' }}>
                          {/* Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--b1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                              <Avatar name={r.reviewer?.fullName} id={r.reviewer?._id} size={40} radius="50%" />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.25rem' }}>
                                  <div style={{ fontSize: '.9rem', fontWeight: 700 }}>{r.reviewer?.fullName}</div>
                                  {r.reviewer?.isVerified && <Badge variant="ok" style={{ fontSize: '.6rem', padding: '2px 6px' }}>✓ Verified</Badge>}
                                </div>
                                <div style={{ fontSize: '.75rem', color: 'var(--txt3)' }}>{formatDate(r.createdAt)}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              {r.reviewType && <div style={{ fontSize: '.7rem', color: 'var(--txt3)', marginBottom: '.35rem', textTransform: 'capitalize', background: 'var(--s2)', padding: '2px 8px', borderRadius: 6, display: 'inline-block' }}>{r.reviewType?.replace('_', ' ')}</div>}
                              <div style={{ display: 'flex', gap: '.25rem', fontSize: '1.25rem', justifyContent: 'flex-end' }}>
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} style={{ color: i < r.rating ? 'var(--warn)' : 'var(--s3)' }}>★</span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Comment */}
                          <p style={{ fontSize: '.9rem', color: 'var(--txt2)', lineHeight: 1.7, marginBottom: '1.25rem' }}>{r.comment}</p>

                          {/* Category Ratings */}
                          {(r.categories?.communication || r.categories?.quality || r.categories?.expertise || r.categories?.timeliness) && (
                            <div style={{ background: 'var(--s2)', borderRadius: 11, padding: '1rem', marginBottom: '1rem' }}>
                              <div style={{ fontSize: '.8rem', fontWeight: 700, marginBottom: '.75rem', color: 'var(--txt2)' }}>📊 Detailed Ratings</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                {[
                                  { label: '💬 Communication', rating: r.categories?.communication },
                                  { label: '✨ Quality', rating: r.categories?.quality },
                                  { label: '🎯 Expertise', rating: r.categories?.expertise },
                                  { label: '⏱️ Timeliness', rating: r.categories?.timeliness }
                                ].map(cat => cat.rating ? (
                                  <div key={cat.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '.85rem' }}>
                                    <span style={{ color: 'var(--txt3)', fontWeight: 500 }}>{cat.label}</span>
                                    <div style={{ display: 'flex', gap: '.15rem', fontSize: '0.95rem' }}>
                                      {[...Array(5)].map((_, i) => (
                                        <span key={i} style={{ color: i < cat.rating ? 'var(--warn)' : 'var(--s3)' }}>★</span>
                                      ))}
                                    </div>
                                  </div>
                                ) : null)}
                              </div>
                            </div>
                          )}

                          {/* Seller Response */}
                          {r.sellerResponse && (
                            <div style={{ background: 'rgba(108,78,246,.08)', borderLeft: '3px solid var(--acc)', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
                              <div style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--acc)', marginBottom: '.5rem' }}>💬 Freelancer Response</div>
                              <p style={{ fontSize: '.85rem', color: 'var(--txt2)', lineHeight: 1.6, margin: 0 }}>{r.sellerResponse}</p>
                              {r.sellerRespondedAt && <div style={{ fontSize: '.7rem', color: 'var(--txt3)', marginTop: '.5rem' }}>Responded {formatDate(r.sellerRespondedAt)}</div>}
                            </div>
                          )}

                          {/* Helpful Buttons */}
                          <div style={{ display: 'flex', gap: '.5rem', paddingTop: '.75rem', borderTop: '1px solid var(--b1)' }}>
                            <button style={{ fontSize: '.8rem', padding: '6px 12px', borderRadius: 6, background: 'var(--s2)', border: 'none', cursor: 'pointer', color: 'var(--txt2)', transition: 'all .2s' }} onMouseEnter={e => e.target.style.background = 'var(--b1)'} onMouseLeave={e => e.target.style.background = 'var(--s2)'}>👍 Helpful</button>
                            <button style={{ fontSize: '.8rem', padding: '6px 12px', borderRadius: 6, background: 'var(--s2)', border: 'none', cursor: 'pointer', color: 'var(--txt2)', transition: 'all .2s' }} onMouseEnter={e => e.target.style.background = 'var(--b1)'} onMouseLeave={e => e.target.style.background = 'var(--s2)'}>👎 Not Helpful</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'ai' && (
              <div className="card">
                <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '1rem' }}>AI Skill Assessment</h3>
                <div style={{ height: 280 }}>
                  <Radar data={radarData} options={{ responsive: true, maintainAspectRatio: false, scales: { r: { grid: { color: 'rgba(255,255,255,.08)' }, ticks: { color: '#9896B4', font: { size: 9 } }, pointLabels: { color: '#9896B4', font: { size: 10 } }, min: 0, max: 100 } }, plugins: { legend: { display: false } } }} />
                </div>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '1.75rem', fontWeight: 700, color: 'var(--acc)' }}>{fl.aiSkillScore || 0}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--txt3)' }}>Overall AI Score / 100</div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: 80 }}>
            {isAuthenticated && user?._id !== fl._id && (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <Button variant="primary" full size="lg" onClick={() => setShowHire(true)} style={{ marginBottom: 8 }}>
                  Hire {fl.fullName?.split(' ')[0]}
                </Button>
                <Button variant="ghost" full size="md" onClick={async () => {
                  try {
                    const { data } = await api.post('/messages/conversations', { recipientId: id });
                    navigate(`/dashboard/messages/${data.conversation._id}`);
                    toast.success('Conversation opened');
                  } catch {
                    toast.error('Failed to start conversation');
                  }
                }}>
                  💬 Send Message
                </Button>
              </div>
            )}
            <div className="card" style={{ padding: '0.875rem' }}>
              <h3 style={{ fontSize: '.875rem', fontWeight: 700, marginBottom: '.875rem' }}>Quick Stats</h3>
              {[['Total Jobs', fl.completedJobs || 0], ['Response Time', (fl.responseTime || 0) < 1 ? '< 1 hour' : `~${fl.responseTime}h`], ['Repeat Clients', fl.repeatClients || 0], ['Success Rate', fl.totalJobs > 0 ? Math.round(fl.completedJobs / fl.totalJobs * 100) + '%' : '—']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--b1)', fontSize: '.82rem' }}>
                  <span style={{ color: 'var(--txt2)' }}>{l}</span>
                  <span style={{ fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showHire && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowHire(false)}>
          <div className="modal">
            <div className="modal-header"><span className="modal-title">Hire {fl.fullName}</span><button className="modal-close" onClick={() => setShowHire(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Project Description *</label><textarea className="textarea" id="hire-desc" placeholder="Describe the work..." style={{ minHeight: 100 }} /></div>
              <div className="grid-2">
                <div className="form-group"><label className="form-label">Budget ($)</label><input className="input" id="hire-budget" type="number" placeholder="1000" /></div>
                <div className="form-group"><label className="form-label">Duration</label><select className="select" id="hire-duration"><option>1 week</option><option>2 weeks</option><option>1 month</option><option>3 months</option></select></div>
              </div>
              <Button variant="primary" full onClick={async () => {
                const desc = document.getElementById('hire-desc').value;
                const budget = document.getElementById('hire-budget').value;
                if (!desc || !budget) { toast.error('Please fill all fields'); return; }
                try {
                  await api.post('/orders', { freelancerId: fl._id, title: `Project with ${fl.fullName}`, totalAmount: +budget, description: desc });
                  toast.success('Offer sent! 🚀'); setShowHire(false);
                } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
              }}>Send Offer →</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default FreelancerProfile;
