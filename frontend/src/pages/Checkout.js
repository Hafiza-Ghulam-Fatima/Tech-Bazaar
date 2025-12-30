import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';
import { FaCreditCard, FaPaypal, FaMoneyBill } from 'react-icons/fa';

const Checkout = () => {
  const { cart } = useCart();
  const navigate = useNavigate();
  
  // Format price in Pakistani Rupees
  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Rs 0';
    const numPrice = parseFloat(price);
    return 'Rs ' + numPrice.toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    paymentMethod: 'credit_card',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    saveInfo: false,
  });
  
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Shipping info validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    
    // Payment validation based on method
    if (formData.paymentMethod === 'credit_card') {
      if (!formData.cardNumber) newErrors.cardNumber = 'Card number is required';
      else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
        newErrors.cardNumber = 'Card number must be 16 digits';
      }
      
      if (!formData.cardExpiry) newErrors.cardExpiry = 'Expiry date is required';
      else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.cardExpiry)) {
        newErrors.cardExpiry = 'Format: MM/YY';
      }
      
      if (!formData.cardCVC) newErrors.cardCVC = 'CVC is required';
      else if (!/^\d{3,4}$/.test(formData.cardCVC)) {
        newErrors.cardCVC = 'CVC must be 3-4 digits';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setProcessing(true);
    
    try {
      const shippingAddress = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      };

      const orderData = {
        shipping_address: shippingAddress,
        payment_method: formData.paymentMethod,
      };

      const response = await orderService.createOrder(orderData);
      
      // Clear cart and redirect to success page
      alert('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setProcessing(false);
    }
  };

  if (!cart || cart.cartItems.length === 0) {
    return (
      <div className="container text-center py-5">
        <h2>Your cart is empty</h2>
        <p className="mb-4">Add some products to your cart before checkout.</p>
        <button className="btn btn-primary" onClick={() => navigate('/products')}>
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="mb-4">Checkout</h1>
      
      <div className="d-flex flex-wrap" style={{ gap: '2rem' }}>
        {/* Checkout Form */}
        <div style={{ flex: '1 0 300px' }}>
          <form onSubmit={handleSubmit} className="checkout-form">
            {errors.general && (
              <div className="alert alert-danger">{errors.general}</div>
            )}

            {/* Shipping Information */}
            <div className="form-section">
              <h3 className="section-title">Shipping Information</h3>
              
              <div className="d-flex gap-2 mb-3">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    className={`form-control ${errors.firstName ? 'error' : ''}`}
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                  {errors.firstName && (
                    <div className="error-message">{errors.firstName}</div>
                  )}
                </div>
                
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    className={`form-control ${errors.lastName ? 'error' : ''}`}
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                  {errors.lastName && (
                    <div className="error-message">{errors.lastName}</div>
                  )}
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className={`form-control ${errors.email ? 'error' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <div className="error-message">{errors.email}</div>
                )}
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Phone (Optional)</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  name="address"
                  className={`form-control ${errors.address ? 'error' : ''}`}
                  value={formData.address}
                  onChange={handleChange}
                />
                {errors.address && (
                  <div className="error-message">{errors.address}</div>
                )}
              </div>

              <div className="address-grid">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    name="city"
                    className={`form-control ${errors.city ? 'error' : ''}`}
                    value={formData.city}
                    onChange={handleChange}
                  />
                  {errors.city && (
                    <div className="error-message">{errors.city}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    name="state"
                    className={`form-control ${errors.state ? 'error' : ''}`}
                    value={formData.state}
                    onChange={handleChange}
                  />
                  {errors.state && (
                    <div className="error-message">{errors.state}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">ZIP Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    className={`form-control ${errors.zipCode ? 'error' : ''}`}
                    value={formData.zipCode}
                    onChange={handleChange}
                  />
                  {errors.zipCode && (
                    <div className="error-message">{errors.zipCode}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    name="country"
                    className={`form-control ${errors.country ? 'error' : ''}`}
                    value={formData.country}
                    onChange={handleChange}
                  />
                  {errors.country && (
                    <div className="error-message">{errors.country}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="form-section">
              <h3 className="section-title">Payment Method</h3>
              
              <div className="mb-3">
                <div className="form-check mb-2">
                  <input
                    type="radio"
                    id="credit_card"
                    name="paymentMethod"
                    value="credit_card"
                    checked={formData.paymentMethod === 'credit_card'}
                    onChange={handleChange}
                    className="form-check-input"
                  />
                  <label htmlFor="credit_card" className="form-check-label">
                    <FaCreditCard className="mr-2" /> Credit Card
                  </label>
                </div>
                
                <div className="form-check mb-2">
                  <input
                    type="radio"
                    id="paypal"
                    name="paymentMethod"
                    value="paypal"
                    checked={formData.paymentMethod === 'paypal'}
                    onChange={handleChange}
                    className="form-check-input"
                  />
                  <label htmlFor="paypal" className="form-check-label">
                    <FaPaypal className="mr-2" /> PayPal
                  </label>
                </div>
                
                <div className="form-check">
                  <input
                    type="radio"
                    id="cash_on_delivery"
                    name="paymentMethod"
                    value="cash_on_delivery"
                    checked={formData.paymentMethod === 'cash_on_delivery'}
                    onChange={handleChange}
                    className="form-check-input"
                  />
                  <label htmlFor="cash_on_delivery" className="form-check-label">
                    <FaMoneyBill className="mr-2" /> Cash on Delivery
                  </label>
                </div>
              </div>

              {formData.paymentMethod === 'credit_card' && (
                <div className="card mb-3">
                  <div className="card-body">
                    <div className="form-group mb-3">
                      <label className="form-label">Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        className={`form-control ${errors.cardNumber ? 'error' : ''}`}
                        value={formData.cardNumber}
                        onChange={handleChange}
                        placeholder="1234 5678 9012 3456"
                      />
                      {errors.cardNumber && (
                        <div className="error-message">{errors.cardNumber}</div>
                      )}
                    </div>
                    
                    <div className="d-flex gap-2 mb-3">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Expiry Date</label>
                        <input
                          type="text"
                          name="cardExpiry"
                          className={`form-control ${errors.cardExpiry ? 'error' : ''}`}
                          value={formData.cardExpiry}
                          onChange={handleChange}
                          placeholder="MM/YY"
                        />
                        {errors.cardExpiry && (
                          <div className="error-message">{errors.cardExpiry}</div>
                        )}
                      </div>
                      
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">CVC</label>
                        <input
                          type="text"
                          name="cardCVC"
                          className={`form-control ${errors.cardCVC ? 'error' : ''}`}
                          value={formData.cardCVC}
                          onChange={handleChange}
                          placeholder="123"
                        />
                        {errors.cardCVC && (
                          <div className="error-message">{errors.cardCVC}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-check mb-3">
              <input
                type="checkbox"
                id="saveInfo"
                name="saveInfo"
                checked={formData.saveInfo}
                onChange={handleChange}
                className="form-check-input"
              />
              <label htmlFor="saveInfo" className="form-check-label">
                Save this information for next time
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={processing}
            >
              {processing ? (
                <>
                  <span className="spinner" style={{ width: '20px', height: '20px' }}></span>
                  Processing Order...
                </>
              ) : (
                `Place Order - ${formatPrice(cart.summary?.total || 0)}`
              )}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div style={{ flex: '0 0 350px' }}>
          <div className="order-summary">
            <h2 className="summary-title">Order Summary</h2>
            
            <div className="mb-4">
              <div className="summary-row">
                <span>Items ({cart.cartItems.length})</span>
                <span>{formatPrice(cart.summary?.subtotal || 0)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>
                  {cart.summary?.shipping === 0 ? 'FREE' : formatPrice(cart.summary?.shipping || 0)}
                </span>
              </div>
              <div className="summary-row">
                <span>Tax</span>
                <span>{formatPrice(cart.summary?.tax || 0)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>{formatPrice(cart.summary?.total || 0)}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <h4>Order Items</h4>
              <div className="d-flex flex-column gap-2">
                {cart.cartItems.map(item => (
                  <div key={item.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div style={{ fontSize: '0.875rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary-color)' }}>
                        Qty: {item.quantity}
                      </div>
                    </div>
                    <div style={{ fontWeight: '500' }}>
                      {formatPrice((item.discounted_price || item.price) * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="alert alert-info">
              <strong>Free Shipping</strong> on orders over Rs 10,000
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;