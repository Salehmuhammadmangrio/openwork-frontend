import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge, SkillTag, Avatar, EmptyState } from '../components/common/UI';
import { debounce } from '../utils/helpers';
import { useAuthStore } from '../store';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CAT_EMOJIS = { 'Web Development': '💻', 'UI/UX Design': '🎨', 'Data Science / AI': '🤖', 'Mobile Development': '📱', 'Content Writing': '✍️', 'Graphic Design': '🎯', 'DevOps & Cloud': '☁️', 'Digital Marketing': '📊' };
const BG_GRADIENTS = ['linear-gradient(135deg,rgba(108,78,246,.18),rgba(0,229,195,.12))', 'linear-gradient(135deg,rgba(255,107,53,.15),rgba(255,77,106,.1))', 'linear-gradient(135deg,rgba(0,229,195,.15),rgba(0,184,148,.1))', 'linear-gradient(135deg,rgba(255,181,46,.15),rgba(255,107,53,.1))', 'linear-gradient(135deg,rgba(155,109,255,.15),rgba(0,229,195,.1))'];

function CreateOfferModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'Web Development', basicPrice: '', standardPrice: '', premiumPrice: '', basicDays: 7, standardDays: 14, premiumDays: 21, basicDesc: '', standardDesc: '', premiumDesc: '', offerThumbnail: null });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append('offerThumbnail', file);

    try {
      const { data } = await api.post('/upload/offer-thumbnail', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      set('offerThumbnail', { url: data.url, publicId: data.publicId });
      setThumbnailPreview(data.url);
      toast.success('Thumbnail uploaded!');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.basicPrice) { toast.error('Title and at least basic package price required'); return; }
    setLoading(true);
    try {
      await api.post('/offers', {
        title: form.title,
        description: form.description,
        category: form.category,
        offerThumbnail: form.offerThumbnail,
        packages: [
          { name: 'basic', title: 'Basic', description: form.basicDesc, price: +form.basicPrice, deliveryDays: +form.basicDays, revisions: 1 },
          ...(form.standardPrice ? [{ name: 'standard', title: 'Standard', description: form.standardDesc, price: +form.standardPrice, deliveryDays: +form.standardDays, revisions: 3 }] : []),
          ...(form.premiumPrice ? [{ name: 'premium', title: 'Premium', description: form.premiumDesc, price: +form.premiumPrice, deliveryDays: +form.premiumDays, revisions: 5 }] : []),
        ],
      });
      toast.success('Offer published! 🎉');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create offer');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <span className="modal-title">Create an Open Offer</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label className="form-label">Offer Title *</label><input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="I will build a complete React + Node.js web application..." required /></div>
            <div className="form-group"><label className="form-label">Category</label><select className="select" value={form.category} onChange={e => set('category', e.target.value)}>{Object.keys(CAT_EMOJIS).map(c => <option key={c}>{c}</option>)}</select></div>

            <div className="form-group">
              <label className="form-label">Offer Thumbnail</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {thumbnailPreview && (
                  <div style={{ width: 120, height: 90, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--b1)', flexShrink: 0 }}>
                    <img src={thumbnailPreview} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleThumbnailUpload}
                    disabled={uploading}
                    style={{ fontSize: '0.875rem' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--txt3)', marginTop: '0.25rem' }}>
                    Max 5MB. JPEG, PNG, or WebP. Recommended: 800x600px.
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group"><label className="form-label">Description</label><textarea className="textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe exactly what you'll deliver, your process, and what makes you unique..." /></div>

            <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--txt2)', marginBottom: '.75rem', marginTop: '.5rem' }}>📦 Package Pricing</div>
            {[['basic', 'Basic'], ['standard', 'Standard'], ['premium', 'Premium']].map(([tier, label]) => (
              <div key={tier} style={{ background: 'var(--s2)', borderRadius: 10, padding: '1rem', marginBottom: '.65rem' }}>
                <div style={{ fontSize: '.82rem', fontWeight: 700, marginBottom: '.65rem', color: tier === 'basic' ? 'var(--txt2)' : tier === 'standard' ? 'var(--acc2)' : 'var(--warn)' }}>
                  {label} {tier !== 'basic' && <span style={{ fontSize: '.68rem', color: 'var(--txt3)' }}>(optional)</span>}
                </div>
                <div className="grid-2">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Price ($) {tier === 'basic' && '*'}</label>
                    <input className="input" type="number" value={form[`${tier}Price`]} onChange={e => set(`${tier}Price`, e.target.value)} placeholder="299" min="5" required={tier === 'basic'} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Delivery (days)</label>
                    <input className="input" type="number" value={form[`${tier}Days`]} onChange={e => set(`${tier}Days`, e.target.value)} min="1" />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0, marginTop: '.65rem' }}>
                  <input className="input" value={form[`${tier}Desc`]} onChange={e => set(`${tier}Desc`, e.target.value)} placeholder="What's included in this package..." />
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: '.5rem' }}>
              <Button type="submit" variant="primary" full loading={loading}>Publish Offer →</Button>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function OfferCard({ offer, idx, showActions = false, onEdit, onDelete }) {
  const navigate = useNavigate();
  const bg = BG_GRADIENTS[idx % BG_GRADIENTS.length];
  const emoji = CAT_EMOJIS[offer.category] || '⚡';
  const basicPkg = offer.packages?.find(p => p.name === 'basic');
  const thumbnailUrl = offer.offerThumbnail?.url || (offer.images && offer.images.length > 0 ? offer.images[0].url : null);

  return (
    <div
      style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'all .25s', boxShadow: 'var(--inv-shadow)' }}
      onClick={() => navigate(`/offers/${offer._id}`)}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(108,78,246,.3)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ height: 148, background: thumbnailUrl ? 'transparent' : bg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={offer.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '3rem' }}>{emoji}</span>
        )}
      </div>
      <div style={{ padding: '1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: '.65rem' }}>

          {offer.seller?.fullName && (<Avatar name={offer.seller?.fullName} image={offer.seller?.profileImage} id={offer.seller?._id} size={26} radius="50%" />)}
          {offer.seller?.fullName && (<span style={{ fontSize: '.78rem', fontWeight: 600 }}>{offer.seller?.fullName}</span>)}
          <Badge variant="teal" style={{ marginLeft: 'auto', fontSize: '.65rem' }}>{offer.category}</Badge>
        </div>
        <div style={{ fontSize: '.875rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '.75rem' }}>{offer.title}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--b1)', paddingTop: '.75rem' }}>
          <div style={{ fontSize: '.75rem', color: 'var(--warn)' }}>
            ★ {offer.avgRating?.toFixed(1) || '—'} <span style={{ color: 'var(--txt3)' }}>({offer.totalReviews || 0})</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '.65rem', color: 'var(--txt3)' }}>Starting at</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '.9rem', fontWeight: 700 }}>
              ${basicPkg?.price || '—'}
            </div>
          </div>
        </div>
        {showActions && (
          <div style={{ display: 'flex', gap: 6, marginTop: '.75rem', borderTop: '1px solid var(--b1)', paddingTop: '.75rem' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                background: 'var(--acc)',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all .2s'
              }}
            >
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 6,
                border: '1px solid var(--b1)',
                background: 'transparent',
                color: 'var(--error)',
                cursor: 'pointer',
                transition: 'all .2s'
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrowseOffers() {
  const { isAuthenticated, user, activeRole } = useAuthStore();
  const [offers, setOffers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const canClient = user?.role === 'client' || user?.canActAsClient;
  const roleMode = activeRole || (canClient ? 'client' : 'freelancer');
  const isFreelancerMode = roleMode === 'freelancer';

  const fetchOffers = useCallback(async (params) => {
    setLoading(true);
    try {
      const { data } = await api.get('/offers', { params });
      const list = data.offers || [];
      setOffers(list);
      setTotal(data.total || list.length);
    } catch {
      setOffers([]);
      setTotal(0);
    }
    finally { setLoading(false); }
  }, []);

  const debouncedSearch = useCallback(
    debounce(s => fetchOffers({ search: s, category, sort, page: 1, limit: 12 }), 400), [category, sort]
  );

  useEffect(
    () => {
      fetchOffers({ search, category, sort, page, limit: 12 });
    },
    [category, sort, page]);

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh' }}>
      <div style={{ background: 'var(--s1)', borderBottom: '1px solid var(--b1)', padding: '2.5rem 1.5rem' }}>
        <div className="container">
          <div className="sec-tag">Open Offers</div>
          <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, margin: '.5rem 0' }}>Explore Service Packages</h1>
          <p style={{ color: 'var(--txt2)', maxWidth: 500 }}>Ready-to-buy packages from AI-verified freelancers with transparent pricing</p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        <div className="discover-toolbar">
          <div className="discover-search-wrap">
            <span className="discover-search-icon">🔍</span>
            <input className="discover-search" placeholder="Search offers..." value={search} onChange={e => { setSearch(e.target.value); debouncedSearch(e.target.value); }} />
          </div>
          <select className="discover-select" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {Object.keys(CAT_EMOJIS).map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="discover-chip-row">
            {[['latest', 'Latest'], ['rating', 'Top Rated'], ['orders', 'Most Popular']].map(([k, l]) => (
              <button key={k} className={`discover-chip${sort === k ? ' active' : ''}`} onClick={() => { setSort(k); setPage(1); }}>{l}</button>
            ))}
          </div>
          {isAuthenticated && isFreelancerMode && (
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>+ Create Offer</Button>
          )}
        </div>

        {!loading && <div style={{ fontSize: '.82rem', color: 'var(--txt3)', marginBottom: '1.25rem' }}>Showing {offers.length} of {total} offers</div>}

        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : offers.length === 0 ? (
          <EmptyState icon="⚡" title="No offers found" message="Try different search terms or categories" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.25rem' }}>
            {offers.map((offer, i) => <OfferCard key={offer._id} offer={offer} idx={i} />)}
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

      {showCreate && <CreateOfferModal onClose={() => setShowCreate(false)} onSuccess={() => fetchOffers({ page: 1, limit: 12 })} />}
    </div>
  );
}
