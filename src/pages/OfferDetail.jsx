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


export default function OfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [offer, setOffer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState('basic');
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    api.get(`/offers/${id}`)
      .then(({ data }) => { setOffer(data.offer); setLoading(false); })
      .catch(() => { toast.error('Offer not found'); navigate('/offers'); });
  }, [id]);

  useEffect(() => {
    if (id) {
      setReviewsLoading(true);
      api.get(`/reviews/offer/${id}`, { params: { limit: 10, page: 1 } })
        .then(({ data }) => setReviews(data.reviews || []))
        .catch(() => setReviews([]))
        .finally(() => setReviewsLoading(false));
    }
  }, [id]);

  if (loading) return <PageLoader />;
  if (!offer) return null;

  const pkg = offer.packages?.find(p => p.name === selectedPkg) || offer.packages?.[0];
  // FIXED: No fee charged to client. Fee is deducted from freelancer earnings only.
  // Client pays only the package price

  const BG_MAP = { basic: 'rgba(108,78,246,.08)', standard: 'rgba(0,229,195,.08)', premium: 'rgba(255,181,46,.08)' };
  const BORDER_MAP = { basic: 'rgba(108,78,246,.2)', standard: 'rgba(0,229,195,.2)', premium: 'rgba(255,181,46,.2)' };

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 2rem' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/offers')} style={{ marginBottom: '2rem' }}>← Back to Offers</Button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem', alignItems: 'start' }}>
          <div>
            {/* Seller & Title Section */}
            <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
              {/* Thumbnail */}
              {offer.offerThumbnail?.url && (
                <div style={{ marginBottom: '1.5rem', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--b1)' }}>
                  <img
                    src={offer.offerThumbnail.url}
                    alt={offer.title}
                    style={{ width: '100%', height: 'auto', maxHeight: 400, objectFit: 'cover' }}
                  />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
                <Avatar name={offer.seller?.fullName} image={offer.seller?.profileImage} id={offer.seller?._id} size={48} radius={12} />
                <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => navigate(`/freelancers/${offer.seller?._id}`)}>
                  <div style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--acc)' }}>{offer.seller?.fullName}</div>
                  <div style={{ fontSize: '.765rem', color: 'var(--txt2)', marginTop: 2 }}>{offer.seller?.title} · ⭐ {offer.seller?.averageRating?.toFixed(1)} ({offer.seller?.totalReviews} reviews)</div>
                </div>
                <Badge variant="teal">{offer.category}</Badge>
              </div>
              <div style={{ margin: '1.5rem 0', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.3 }}>{offer.title}</h1>
              </div>
              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>⏱ {offer.deliveryDays || pkg?.deliveryDays || 'N/A'} days</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>🔄 {offer.revisions || pkg?.revisions || 'N/A'} revision{(offer.revisions || pkg?.revisions) !== 1 ? 's' : ''}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>💰 Starting at ${pkg?.price || 'N/A'}</span>
              </div>
              <p style={{ fontSize: '.925rem', color: 'var(--txt2)', lineHeight: 1.8, marginBottom: 0 }}>{offer.description}</p>
              <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {offer.tags?.map((s, i) => <SkillTag key={i} skill={s} />)}
              </div>
            </div>

            {/* FAQs Section */}
            {offer.faqs?.length > 0 && (
              <div className="card" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Frequently Asked Questions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {offer.faqs.map((faq, i) => (
                    <div key={i} style={{ padding: '1rem', background: 'var(--s2)', borderRadius: 11, border: '1px solid var(--b1)' }}>
                      <div style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '.5rem', color: 'var(--txt)' }}>Q: {faq.question}</div>
                      <div style={{ fontSize: '.85rem', color: 'var(--txt2)', lineHeight: 1.6 }}>A: {faq.answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pricing Sidebar */}
          <div style={{ position: 'sticky', top: 90 }}>
            <div className="card" style={{ padding: '2rem' }}>
              {/* Package Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', background: 'var(--s2)', borderRadius: 11, padding: 6 }}>
                {(offer.packages || []).map(p => (
                  <button
                    key={p.name}
                    onClick={() => setSelectedPkg(p.name)}
                    style={{
                      flex: 1,
                      padding: '9px 0',
                      borderRadius: 8,
                      fontSize: '.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all .2s',
                      background: selectedPkg === p.name ? 'var(--acc)' : 'transparent',
                      color: selectedPkg === p.name ? '#fff' : 'var(--txt2)',
                      border: 'none',
                      fontFamily: 'Outfit, sans-serif'
                    }}
                  >
                    {p.title || p.name.charAt(0).toUpperCase() + p.name.slice(1)}
                  </button>
                ))}
              </div>

              {/* Package Details */}
              {pkg && (
                <>
                  <div style={{ background: BG_MAP[selectedPkg], border: `1.5px solid ${BORDER_MAP[selectedPkg]}`, borderRadius: 13, padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '2rem', fontWeight: 700, marginBottom: '.75rem', color: 'var(--txt)' }}>${pkg.price}</div>
                    <p style={{ fontSize: '.875rem', color: 'var(--txt2)', marginBottom: '1rem', lineHeight: 1.6 }}>{pkg.description}</p>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '.80rem', color: 'var(--txt2)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>⏱ {pkg.deliveryDays} days</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>🔄 {pkg.revisions} revision{pkg.revisions !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div style={{ background: 'var(--s2)', borderRadius: 11, padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid var(--b1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', padding: '8px 0', marginBottom: 10, borderBottom: '1px solid var(--b1)' }}>
                      <span style={{ color: 'var(--txt2)' }}>Package Price</span>
                      <span style={{ fontWeight: 600, color: 'var(--txt)' }}>${pkg.price}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, padding: '8px 0' }}>
                      <span>Total Amount</span>
                      <span style={{ color: 'var(--acc2)', fontFamily: 'Space Mono, monospace' }}>${pkg.price}</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  {isAuthenticated ? (
                    <Button
                      variant="primary"
                      full
                      size="lg"
                      onClick={() => navigate('/checkout', { state: { offer, pkg, selectedPkg } })}
                      style={{ height: 48, fontSize: '.95rem' }}
                    >
                      Continue (${pkg.price}) →
                    </Button>
                  ) : (
                    <Button variant="ghost" full size="lg" onClick={() => navigate('/login')}>Sign in to Purchase</Button>
                  )}
                </>
              )}

              <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '.72rem', color: 'var(--txt3)' }}>🔒 Secured by Stripe · Escrow Protected</div>
            </div>

            {/* Stats Card */}
            <div className="card" style={{ marginTop: '1.5rem', padding: '1.75rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'space-around', textAlign: 'center' }}>
                {[['⭐ ' + (offer.avgRating?.toFixed(1) || '—'), 'Rating'], [offer.totalReviews || 0, 'Reviews'], [offer.totalOrders || 0, 'Orders']].map(([v, l]) => (
                  <div key={l}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--txt)' }}>{v}</div>
                    <div style={{ fontSize: '.7rem', color: 'var(--txt3)', marginTop: 4 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}