import React, { useState } from 'react';
import { Button, Input } from './UI';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function FakePaymentForm({ amount, orderId, onSuccess }) {
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCardData({ ...cardData, [e.target.name]: e.target.value });
  };

  const luhnCheck = (cardNum) => {
    let sum = 0;
    let isEven = false;
    for (let i = cardNum.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNum[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  };

  const validateCard = () => {
    // Validate card format and use Luhn check
    const cardNum = cardData.number.replace(/\s/g, '');

    // Check length and numeric
    if (cardNum.length < 13 || cardNum.length > 19 || !/^\d+$/.test(cardNum)) {
      return false;
    }

    // Luhn validation
    if (!luhnCheck(cardNum)) {
      return false;
    }

    // Check expiry format
    if (!cardData.expiry.match(/^\d{2}\/\d{2}$/)) {
      return false;
    }

    // Check CVC
    if (cardData.cvc.length < 3 || cardData.cvc.length > 4) {
      return false;
    }

    // Check name
    if (!cardData.name.trim()) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCard()) {
      toast.error('Invalid card details. Test: 4242424242424242 | 12/34 | 123');
      return;
    }

    setLoading(true);
    try {
      // Attempt to confirm payment with backend
      // Note: This endpoint may not be available in the current backend
      // In that case, we simulate success locally
      try {
        const res = await api.post('/payments/confirm', {
          orderId,
          paymentIntentId: 'fake_' + Date.now(),
          cardData: {
            cardNumber: cardData.number.replace(/\s/g, '').slice(-4),
            holderName: cardData.name
          }
        });
        if (res.data.success) {
          toast.success('Payment successful! 🎉');
          onSuccess();
          return;
        }
      } catch (backendErr) {
        // Backend endpoint not available - simulate success for demo
        if (backendErr.response?.status === 404 || backendErr.response?.status === 501) {
          toast.success('Payment successful! 🎉 (Demo mode)');
          onSuccess();
          return;
        }
        throw backendErr;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }

  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Card Number</label>
        <Input
          name="number"
          value={cardData.number}
          onChange={handleChange}
          placeholder="4242 4242 4242 4242"
          maxLength={19}
        />
      </div>
      <div className="grid-3">
        <div className="form-group">
          <label className="form-label">Expiry</label>
          <Input
            name="expiry"
            value={cardData.expiry}
            onChange={handleChange}
            placeholder="MM/YY"
            maxLength={5}
          />
        </div>
        <div className="form-group">
          <label className="form-label">CVC</label>
          <Input
            name="cvc"
            value={cardData.cvc}
            onChange={handleChange}
            placeholder="123"
            maxLength={4}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Name</label>
          <Input
            name="name"
            value={cardData.name}
            onChange={handleChange}
            placeholder="John Doe"
          />
        </div>
      </div>
      <div style={{ fontSize: '.75rem', color: 'var(--txt2)', marginBottom: '1rem' }}>
        Test card: <strong>4242 4242 4242 4242</strong> | Any future date | Any 3 CVC | Any name
      </div>
      <Button type="submit" variant="primary" full size="lg" loading={loading}>
        Pay ${amount} → Secure Checkout
      </Button>
    </form>
  );
}

