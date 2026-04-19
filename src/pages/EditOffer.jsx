import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Badge, Avatar, EmptyState, PageLoader } from '../components/common/UI';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CAT_EMOJIS = { 'Web Development': '💻', 'UI/UX Design': '🎨', 'Data Science / AI': '🤖', 'Mobile Development': '📱', 'Content Writing': '✍️', 'Graphic Design': '🎯', 'DevOps & Cloud': '☁️', 'Digital Marketing': '📊' };

export default function EditOffer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [offer, setOffer] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Web Development',
    basicPrice: '',
    standardPrice: '',
    premiumPrice: '',
    basicDays: 7,
    standardDays: 14,
    premiumDays: 21,
    basicDesc: '',
    standardDesc: '',
    premiumDesc: '',
    offerThumbnail: null,
  });
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  useEffect(() => {
    fetchOffer();
  }, [id]);

  const fetchOffer = async () => {
    try {
      const { data } = await api.get(`/offers/${id}`);
      const offerData = data.offer;
      setOffer(offerData);
      setForm({
        title: offerData.title || '',
        description: offerData.description || '',
        category: offerData.category || 'Web Development',
        basicPrice: offerData.packages?.find(p => p.name === 'basic')?.price || '',
        standardPrice: offerData.packages?.find(p => p.name === 'standard')?.price || '',
        premiumPrice: offerData.packages?.find(p => p.name === 'premium')?.price || '',
        basicDays: offerData.packages?.find(p => p.name === 'basic')?.deliveryDays || 7,
        standardDays: offerData.packages?.find(p => p.name === 'standard')?.deliveryDays || 14,
        premiumDays: offerData.packages?.find(p => p.name === 'premium')?.deliveryDays || 21,
        basicDesc: offerData.packages?.find(p => p.name === 'basic')?.description || '',
        standardDesc: offerData.packages?.find(p => p.name === 'standard')?.description || '',
        premiumDesc: offerData.packages?.find(p => p.name === 'premium')?.description || '',
        offerThumbnail: offerData.offerThumbnail || null,
      });
      if (offerData.offerThumbnail?.url) {
        setThumbnailPreview(offerData.offerThumbnail.url);
      }
    } catch (err) {
      toast.error('Failed to load offer');
      navigate('/dashboard/my-offers');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

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
      toast.success('Thumbnail updated!');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveThumbnail = () => {
    set('offerThumbnail', null);
    setThumbnailPreview(null);
    toast.success('Thumbnail removed');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.basicPrice) {
      toast.error('Title and basic package price are required');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/offers/${id}`, {
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
      toast.success('Offer updated successfully! 🎉');
      navigate('/dashboard/my-offers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update offer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!offer) {
    return <EmptyState icon="⚡" title="Offer not found" message="The offer you're looking for doesn't exist" />;
  }

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh' }}>
      <div style={{ background: 'var(--s1)', borderBottom: '1px solid var(--b1)', padding: '2.5rem 1.5rem' }}>
        <div className="container">
          <div className="sec-tag">Edit Offer</div>
          <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, margin: '.5rem 0' }}>Update Your Service Package</h1>
          <p style={{ color: 'var(--txt2)', maxWidth: 500 }}>Modify your offer details, pricing, and thumbnail</p>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} style={{ marginBottom: '2rem' }}>← Back</Button>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Offer Title *</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="I will build a complete React + Node.js web application..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
                  {Object.keys(CAT_EMOJIS).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Offer Thumbnail</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  {thumbnailPreview && (
                    <div style={{ width: 120, height: 90, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--b1)', flexShrink: 0, position: 'relative' }}>
                      <img src={thumbnailPreview} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={handleRemoveThumbnail}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ✕
                      </button>
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

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="textarea"
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describe exactly what you'll deliver, your process, and what makes you unique..."
                  rows={4}
                />
              </div>

              <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--txt2)', marginBottom: '.75rem', marginTop: '1.5rem' }}>📦 Package Pricing</div>
              {[['basic', 'Basic'], ['standard', 'Standard'], ['premium', 'Premium']].map(([tier, label]) => (
                <div key={tier} style={{ background: 'var(--s2)', borderRadius: 10, padding: '1rem', marginBottom: '.65rem' }}>
                  <div style={{ fontSize: '.82rem', fontWeight: 700, marginBottom: '.65rem', color: tier === 'basic' ? 'var(--txt2)' : tier === 'standard' ? 'var(--acc2)' : 'var(--warn)' }}>
                    {label} {tier !== 'basic' && <span style={{ fontSize: '.68rem', color: 'var(--txt3)' }}>(optional)</span>}
                  </div>
                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Price ($) {tier === 'basic' && '*'}</label>
                      <input
                        className="input"
                        type="number"
                        value={form[`${tier}Price`]}
                        onChange={e => set(`${tier}Price`, e.target.value)}
                        placeholder="299"
                        min="5"
                        required={tier === 'basic'}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Delivery (days)</label>
                      <input
                        className="input"
                        type="number"
                        value={form[`${tier}Days`]}
                        onChange={e => set(`${tier}Days`, e.target.value)}
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, marginTop: '.65rem' }}>
                    <input
                      className="input"
                      value={form[`${tier}Desc`]}
                      onChange={e => set(`${tier}Desc`, e.target.value)}
                      placeholder="What's included in this package..."
                    />
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 8, marginTop: '2rem' }}>
                <Button type="submit" variant="primary" full loading={saving}>Save Changes →</Button>
                <Button type="button" variant="ghost" onClick={() => navigate('/dashboard/my-offers')}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
