import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { FaBox, FaShippingFast, FaCheckCircle, FaTimesCircle, FaHistory } from 'react-icons/fa';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getUserOrders();
      
      // Process orders to ensure total_amount is a number
      const processedOrders = (response.orders || []).map(order => ({
        ...order,
        total_amount: parseFloat(order.total_amount) || 0,
        // Ensure items have proper number types
        items: (order.items || []).map(item => ({
          ...item,
          unit_price: parseFloat(item.unit_price) || 0,
          total_price: parseFloat(item.total_price) || 0,
          quantity: parseInt(item.quantity) || 1
        }))
      }));
      
      setOrders(processedOrders);
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Format currency in Rs.
  const formatCurrency = (amount) => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(num) || !isFinite(num)) {
      return 'Rs. 0';
    }
    
    // Format with thousands separators
    return `Rs. ${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaHistory style={{ color: '#f59e0b' }} />;
      case 'processing': return <FaBox style={{ color: '#3b82f6' }} />;
      case 'shipped': return <FaShippingFast style={{ color: '#8b5cf6' }} />;
      case 'delivered': return <FaCheckCircle style={{ color: '#10b981' }} />;
      case 'cancelled': return <FaTimesCircle style={{ color: '#ef4444' }} />;
      default: return <FaHistory />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate subtotal safely
  const calculateSubtotal = (totalAmount) => {
    const num = parseFloat(totalAmount) || 0;
    return num * 0.9; // Assuming 10% tax
  };

  // Calculate tax safely
  const calculateTax = (totalAmount) => {
    const num = parseFloat(totalAmount) || 0;
    return num * 0.1; // Assuming 10% tax
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger">
          <h5>Error Loading Orders</h5>
          <p>{error}</p>
        </div>
        <button className="btn btn-primary" onClick={fetchOrders}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="mb-4">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-4">
            <FaBox style={{ fontSize: '4rem', color: 'var(--secondary-color)' }} />
          </div>
          <h3>No orders yet</h3>
          <p className="mb-4">You haven't placed any orders yet.</p>
          <Link to="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {orders.map(order => {
            // Safely parse order data
            const totalAmount = parseFloat(order.total_amount) || 0;
            const subtotal = calculateSubtotal(totalAmount);
            const tax = calculateTax(totalAmount);
            const shipping = 10; // Rs. 10 shipping
            
            return (
              <div key={order.id} className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1">Order #{order.order_number || order.id.slice(-8)}</h4>
                    <small className="text-muted">
                      Placed on {formatDate(order.created_at || order.createdAt)}
                    </small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className={`badge badge-${getStatusColor(order.status)}`}>
                      {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
                    </span>
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <h6>Order Total</h6>
                      <h4 className="text-primary">{formatCurrency(totalAmount)}</h4>
                    </div>
                    <div className="col-md-4">
                      <h6>Payment Method</h6>
                      <p className="mb-0">
                        {order.payment_method 
                          ? order.payment_method.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')
                          : 'Credit Card'
                        }
                      </p>
                    </div>
                    <div className="col-md-4">
                      <h6>Payment Status</h6>
                      <span className={`badge badge-${order.payment_status === 'completed' ? 'success' : 'warning'}`}>
                        {order.payment_status 
                          ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)
                          : 'Pending'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-3">
                      <h6>Items ({order.items.length})</h6>
                      <div className="d-flex flex-column gap-2">
                        {order.items.map(item => {
                          const unitPrice = parseFloat(item.unit_price) || 0;
                          const quantity = parseInt(item.quantity) || 1;
                          const itemTotal = parseFloat(item.total_price) || (unitPrice * quantity);
                          
                          return (
                            <div key={item.id} className="d-flex justify-content-between align-items-center border-bottom pb-2">
                              <div>
                                <p className="mb-1">{item.product_name || 'Product'}</p>
                                <small className="text-muted">
                                  Qty: {quantity} × {formatCurrency(unitPrice)}
                                </small>
                              </div>
                              <div className="text-right">
                                <strong>{formatCurrency(itemTotal)}</strong>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="mt-4">
                    <div className="d-flex justify-content-end">
                      <div style={{ minWidth: '250px' }}>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Shipping:</span>
                          <span>{formatCurrency(shipping)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span>Tax:</span>
                          <span>{formatCurrency(tax)}</span>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between">
                          <strong>Total:</strong>
                          <strong>{formatCurrency(totalAmount)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>       
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;