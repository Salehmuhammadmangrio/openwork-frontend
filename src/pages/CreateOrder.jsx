import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store';
import { Button, Input, Alert, Badge } from '../components/common/UI';
import api from '../utils/api';
import toast from 'react-hot-toast';


const CreateOrder = () => {
  const navigate = useNavigate();
  const { offerId, clientId: initialClientId } = useParams();
  const { user, isAuthenticated } = useAuthStore();

  // Form state
  const [orderType, setOrderType] = useState('custom'); // 'custom' or 'direct'
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(initialClientId || null);
  const [clients, setClients] = useState([]);
  const [searchClient, setSearchClient] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    totalAmount: '',
    deliveryDays: 30,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (orderType === 'custom' && user?.role !== 'freelancer') {
      toast.error('Only freelancers can create custom order proposals');
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, orderType, user?.role]);

  // Fetch all conversation clients once on component mount/when orderType changes
  useEffect(() => {
    if (orderType === 'custom' && isAuthenticated) {
      fetchConversationClients();
    }
  }, [orderType, isAuthenticated]);

  const fetchConversationClients = async () => {
    try {
      setLoadingClients(true);
      const { data } = await api.get('/users/conversation-clients', {
        params: { limit: 100 } // Fetch all clients without search filter
      });

      setClients(data.users || []);
    } catch (err) {
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalAmount' || name === 'deliveryDays' ? parseFloat(value) : value
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    if (!formData.totalAmount || formData.totalAmount < 10) {
      newErrors.totalAmount = 'Amount must be at least $10';
    }
    if (!formData.deliveryDays || formData.deliveryDays < 1) {
      newErrors.deliveryDays = 'Delivery days must be at least 1';
    }
    if (orderType === 'custom' && !selectedClient) {
      newErrors.client = 'Please select a client';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (orderType === 'custom') {
        // Freelancer creates custom order proposal
        const payload = {
          title: formData.title,
          description: formData.description,
          totalAmount: parseFloat(formData.totalAmount),
          clientId: selectedClient,
          deliveryDays: parseInt(formData.deliveryDays),
        };

        const { data } = await api.post('/orders/custom', payload);

        toast.success('Order proposal created successfully! Waiting for client acceptance.');
        navigate('/dashboard/orders', { state: { newOrderId: data.order._id } });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create order';
      toast.error(errorMsg);
      setErrors(prev => ({ ...prev, submit: errorMsg }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', }}>
      <div className="container" style={{ margin: '0 auto', }}>
        <div style={{ background: 'var(--s1)', boxShadow: 'var(--inv-shadow)', border: '1px solid var(--b1)', borderRadius: 16, padding: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', }}>
            {/* Title Section */}
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '.5rem' }}>
                Create Order Proposal
              </h1>
              <p style={{ color: 'var(--txt2)', marginBottom: '2rem', lineHeight: 1.6 }}>
                Send a custom order proposal to a client. Once they accept and pay, the order will move to in-progress status.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={
              () => navigate(-1)} style={{ marginBottom: '2rem' }}
            >
              ← Back
            </Button>
          </div>

          {/* Information Box */}
          <div style={{
            background: 'rgba(108,78,246,.08)',
            border: '1px solid rgba(108,78,246,.2)',
            borderRadius: 12,
            padding: '1rem',
            marginBottom: '2rem',
            fontSize: '.85rem',
            color: 'var(--txt2)',
            lineHeight: 1.6,
          }}>
            <div style={{ fontWeight: 700, color: 'var(--txt)', marginBottom: '.5rem' }}>📝 How it works:</div>
            <div>1. Enter client details and describe the work</div>
            <div>2. Set your price (client pays this full amount)</div>
            <div>3. Client accepts and payment goes to escrow</div>
            <div>4. 5% platform fee is deducted from your earnings only</div>
            <div>5. Status changes to "in-progress" and you can start working</div>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {errors.submit && <Alert type="err">{errors.submit}</Alert>}

            {/* Client Selection */}
            <div>
              <label style={{ fontSize: '.875rem', fontWeight: 700, display: 'block', marginBottom: '.5rem' }}>
                Select Client <span style={{ color: 'var(--err)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchClient}
                  onChange={(e) => setSearchClient(e.target.value)}
                  onFocus={() => setDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: 10,
                    border: `1px solid ${errors.client ? 'var(--err)' : 'var(--b1)'}`,
                    background: 'var(--s2)',
                    color: 'var(--txt)',
                    fontSize: '.875rem',
                    marginBottom: '.75rem',
                  }}
                />
                {clients.length > 0 && dropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--s2)',
                    border: '1px solid var(--b1)',
                    borderTop: 'none',
                    borderRadius: '0 0 10px 10px',
                    zIndex: 1000,
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}>
                    {clients
                      .filter(client =>
                        client.fullName.toLowerCase().includes(searchClient.toLowerCase()) ||
                        client.email.toLowerCase().includes(searchClient.toLowerCase())
                      )
                      .map(client => (
                        <div
                          key={client._id}
                          onClick={() => {
                            setSelectedClient(client._id);
                            setSearchClient(client.fullName);
                            setDropdownOpen(false);
                          }}
                          style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--b1)',
                            fontSize: '.875rem',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--s1)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ fontWeight: 600 }}>{client.fullName}</div>
                          <div style={{ fontSize: '.75rem', color: 'var(--txt2)' }}>{client.email}</div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              {loadingClients ? (
                <div style={{ fontSize: '.875rem', color: 'var(--txt2)', marginTop: '.5rem', padding: '0.75rem', background: 'var(--s1)', borderRadius: 8 }}>
                  ⏳ Loading clients with conversations...
                </div>
              ) : clients.length === 0 ? (
                <div style={{ fontSize: '.875rem', color: 'var(--txt2)', marginTop: '.5rem', padding: '0.75rem', background: 'var(--s1)', borderRadius: 8 }}>
                  📝 No clients with conversations yet. Start a conversation with clients first to create custom order proposals.
                </div>
              ) : null}
              {selectedClient && (
                <div style={{ fontSize: '.75rem', color: 'var(--acc)', marginTop: '.5rem' }}>
                  ✓ Client selected
                </div>
              )}
              {errors.client && <div style={{ fontSize: '.75rem', color: 'var(--err)', marginTop: '.25rem' }}>{errors.client}</div>}
            </div>

            {/* Title */}
            <Input
              label="Order Title"
              name="title"
              placeholder="e.g., Build React Dashboard"
              value={formData.title}
              onChange={handleInputChange}
              error={errors.title}
              required
            />

            {/* Description */}
            <div>
              <label style={{ fontSize: '.875rem', fontWeight: 700, display: 'block', marginBottom: '.5rem' }}>
                Description <span style={{ color: 'var(--err)' }}>*</span>
              </label>
              <textarea
                name="description"
                placeholder="Describe the work in detail..."
                value={formData.description}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  borderRadius: 10,
                  border: `1px solid ${errors.description ? 'var(--err)' : 'var(--b1)'}`,
                  background: 'var(--s2)',
                  color: 'var(--txt)',
                  fontSize: '.875rem',
                  minHeight: '120px',
                  fontFamily: 'Outfit, sans-serif',
                  resize: 'vertical',
                }}
                required
              />
              {errors.description && <div style={{ fontSize: '.75rem', color: 'var(--err)', marginTop: '.25rem' }}>{errors.description}</div>}
            </div>

            {/* Amount */}
            <Input
              label="Total Amount ($)"
              name="totalAmount"
              type="number"
              placeholder="Enter amount in USD"
              value={formData.totalAmount}
              onChange={handleInputChange}
              error={errors.totalAmount}
              min="10"
              step="0.01"
              required
            />

            {/* Delivery Days */}
            <Input
              label="Delivery Timeframe (days)"
              name="deliveryDays"
              type="number"
              placeholder="e.g., 30"
              value={formData.deliveryDays}
              onChange={handleInputChange}
              error={errors.deliveryDays}
              min="1"
              required
            />

            {/* Pricing Breakdown */}
            {formData.totalAmount && (
              <div style={{
                background: 'var(--s2)',
                border: '1px solid var(--b1)',
                borderRadius: 10,
                padding: '1rem',
                fontSize: '.85rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                  <span style={{ color: 'var(--txt2)' }}>Client Pays</span>
                  <span style={{ fontWeight: 600 }}>${parseFloat(formData.totalAmount).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.75rem', paddingBottom: '.75rem', borderBottom: '1px solid var(--b1)' }}>
                  <span style={{ color: 'var(--txt2)' }}>Platform Fee (5%)</span>
                  <span style={{ fontWeight: 600, color: 'var(--err)' }}>-${(formData.totalAmount * 0.05).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Your Earnings</span>
                  <span style={{ color: 'var(--acc)' }}>${(formData.totalAmount - formData.totalAmount * 0.05).toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '.75rem', color: 'var(--txt2)', marginTop: '.75rem', lineHeight: 1.5 }}>
                  Client will pay the full amount and it will be held in escrow. Platform fee (5%) is deducted from your earnings only.
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              full
              loading={isLoading}
              style={{ height: 48, marginTop: '1rem' }}
            >
              {isLoading ? 'Creating Proposal...' : 'Send Order Proposal →'}
            </Button>

            <div style={{ fontSize: '.75rem', color: 'var(--txt2)', textAlign: 'center', lineHeight: 1.6 }}>
              📌 The client will receive a notification to accept or decline this proposal.
            </div>
          </form>

          {/* Additional Info */}
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--b1)', fontSize: '.85rem', color: 'var(--txt2)' }}>
            <div style={{ fontWeight: 700, color: 'var(--txt)', marginBottom: '.75rem' }}>
              💡 Tips for successful proposals:
            </div>
            <ul style={{ paddingLeft: '1.25rem', lineHeight: 2 }}>
              <li>Be clear and specific about what you'll deliver</li>
              <li>Set realistic delivery timeframes</li>
              <li>Price competitively based on your skills</li>
              <li>Include any requirements the client needs to provide</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;
