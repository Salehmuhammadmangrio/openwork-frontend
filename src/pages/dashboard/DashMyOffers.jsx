import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks';
import { Button, Input, Textarea, Select, Modal, PageLoader } from '../../components/common/UI';
import api from '../../utils/api';
import { OfferCard } from '../BrowseOffers';
import toast from 'react-hot-toast';

const CAT_EMOJIS = { 'Web Development': '💻', 'UI/UX Design': '🎨', 'Data Science / AI': '🤖', 'Mobile Development': '📱', 'Content Writing': '✍️', 'Graphic Design': '🎯', 'DevOps & Cloud': '☁️', 'Digital Marketing': '📊' };

export default function DashMyOffers() {
    const navigate = useNavigate();
    const { data, loading } = useFetch('/offers/my');
    const offers = data?.offers || [];
    const [createModal, setCreateModal] = useState(false);
    const [uploading, setUploading] = useState(false);
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

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const openCreateModal = () => {
        setForm({
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
        setThumbnailPreview(null);
        setCreateModal(true);
    };

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
            toast.success('Thumbnail uploaded!');
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

    const submitOffer = async () => {
        if (!form.title || !form.basicPrice) {
            toast.error('Title and basic package price are required');
            return;
        }
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
            setCreateModal(false);
            setForm({
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
            setThumbnailPreview(null);
            window.location.reload();
        } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    };

    const handleDelete = async (offerId) => {
        if (!window.confirm('Are you sure you want to delete this offer?')) return;
        try {
            await api.delete(`/offers/${offerId}`);
            toast.success('Offer deleted successfully');
            window.location.reload();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete offer');
        }
    };

    return (
        <div className="animate-up" style={{ padding: '0 2rem' }}>
            <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '.5rem' }}>My Open Offers</h1>
                        <p style={{ color: 'var(--txt2)', fontSize: '.875rem' }}>Manage your service packages</p>
                    </div>
                    <Button variant="primary" size="lg" onClick={openCreateModal}>+ Create Offer</Button>
                </div>
            </div>

            {loading ? (
                <PageLoader />
            ) : offers.length === 0 ? (
                <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--s1)', borderRadius: 16, border: '1px solid var(--b1)', marginTop: '1rem', boxShadow: 'var(--inv-shadow)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '.5rem' }}>No offers yet</h2>
                    <p style={{ color: 'var(--txt2)', marginBottom: '1.5rem' }}>Create service packages that clients can buy instantly</p>
                    <Button variant="primary" onClick={openCreateModal}>Create First Offer</Button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                    {offers.map((offer, i) => (
                        <OfferCard
                            key={offer._id}
                            offer={offer}
                            idx={i}
                            showActions={true}
                            onEdit={() => navigate(`/offers/${offer._id}/edit`)}
                            onDelete={() => handleDelete(offer._id)}
                        />
                    ))}
                </div>
            )}

            <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create New Offer" style={{ maxWidth: 600 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input label="Title *" value={form.title} onChange={e => set('title', e.target.value)} placeholder="I will build a complete React + Node.js web application..." />
                    <Select label="Category" value={form.category} onChange={e => set('category', e.target.value)}>
                        {Object.keys(CAT_EMOJIS).map(c => <option key={c}>{c}</option>)}
                    </Select>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--txt)' }}>Offer Thumbnail</label>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            {thumbnailPreview && (
                                <div style={{ width: 100, height: 75, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--b1)', flexShrink: 0, position: 'relative' }}>
                                    <img src={thumbnailPreview} alt="Thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button
                                        type="button"
                                        onClick={handleRemoveThumbnail}
                                        style={{
                                            position: 'absolute',
                                            top: 4,
                                            right: 4,
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            background: 'rgba(0,0,0,0.7)',
                                            color: '#fff',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '10px',
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
                                <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginTop: '0.25rem' }}>
                                    Max 5MB. JPEG, PNG, or WebP.
                                </div>
                            </div>
                        </div>
                    </div>

                    <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe exactly what you'll deliver, your process, and what makes you unique..." rows={3} />

                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--txt2)', marginBottom: '0.5rem', marginTop: '0.25rem' }}>📦 Package Pricing</div>
                    {[['basic', 'Basic'], ['standard', 'Standard'], ['premium', 'Premium']].map(([tier, label]) => (
                        <div key={tier} style={{ background: 'var(--s2)', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: tier === 'basic' ? 'var(--txt2)' : tier === 'standard' ? 'var(--acc2)' : 'var(--warn)' }}>
                                {label} {tier !== 'basic' && <span style={{ fontSize: '0.65rem', color: 'var(--txt3)' }}>(optional)</span>}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--txt)' }}>Price ($) {tier === 'basic' && '*'}</label>
                                    <input
                                        className="input"
                                        type="number"
                                        value={form[`${tier}Price`]}
                                        onChange={e => set(`${tier}Price`, e.target.value)}
                                        placeholder="299"
                                        min="5"
                                        required={tier === 'basic'}
                                        style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--txt)' }}>Delivery (days)</label>
                                    <input
                                        className="input"
                                        type="number"
                                        value={form[`${tier}Days`]}
                                        onChange={e => set(`${tier}Days`, e.target.value)}
                                        min="1"
                                        style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginTop: '0.5rem' }}>
                                <input
                                    className="input"
                                    value={form[`${tier}Desc`]}
                                    onChange={e => set(`${tier}Desc`, e.target.value)}
                                    placeholder="What's included in this package..."
                                    style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                                />
                            </div>
                        </div>
                    ))}

                    <div style={{ display: 'flex', gap: 8, marginTop: '0.5rem' }}>
                        <Button variant="primary" full onClick={submitOffer}>Publish Offer →</Button>
                        <Button variant="ghost" full onClick={() => setCreateModal(false)}>Cancel</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}