import React, { useState } from 'react';
import { FaTimes, FaPrint, FaTruck, FaCheck, FaCreditCard } from 'react-icons/fa';

const OrderDetailsModal = ({ order, onClose, onUpdateStatus }) => {
  const [status, setStatus] = useState(order.status);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      case 'refunded': return 'secondary';
      default: return 'secondary';
    }
  };

  const handleStatusUpdate = (newStatus) => {
    onUpdateStatus(order.id, newStatus);
    setStatus(newStatus);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content order-details-modal">
        <div className="modal-header">
          <h2>Order Details</h2>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {/* Order Summary */}
          <div className="order-summary mb-4">
            <div className="row">
              <div className="col-md-6">
                <div className="info-card">
                  <h4>Order Information</h4>
                  <div className="info-row">
                    <span className="label">Order #:</span>
                    <span className="value">{order.order_number}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Date:</span>
                    <span className="value">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Status:</span>
                    <span className={`badge badge-${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Payment Status:</span>
                    <span className={`badge badge-${order.payment_status === 'paid' ? 'success' : 'warning'}`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="info-card">
                  <h4>Customer Information</h4>
                  <div className="info-row">
                    <span className="label">Name:</span>
                    <span className="value">{order.shipping_name || order.user_email}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Email:</span>
                    <span className="value">{order.user_email}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Phone:</span>
                    <span className="value">{order.shipping_phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="shipping-address mb-4">
              <h4>Shipping Address</h4>
              <div className="address-card">
                <p>{order.shipping_address}</p>
                <p>
                  {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
                </p>
                <p>{order.shipping_country}</p>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="order-items mb-4">
            <h4>Order Items</h4>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {/* This would typically come from order.order_items */}
                <tr>
                  <td>
                    <div className="product-info">
                      <div className="product-name">Sample Product</div>
                      <div className="product-sku">SKU: ABC123</div>
                    </div>
                  </td>
                  <td>{formatCurrency(49.99)}</td>
                  <td>2</td>
                  <td>{formatCurrency(99.98)}</td>
                </tr>
                {/* Add more items as needed */}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="text-right">Subtotal:</td>
                  <td>{formatCurrency(order.subtotal || order.total_amount)}</td>
                </tr>
                <tr>
                  <td colSpan="3" className="text-right">Shipping:</td>
                  <td>{formatCurrency(order.shipping_cost || 0)}</td>
                </tr>
                <tr>
                  <td colSpan="3" className="text-right">Tax:</td>
                  <td>{formatCurrency(order.tax || 0)}</td>
                </tr>
                <tr>
                  <td colSpan="3" className="text-right font-bold">Total:</td>
                  <td className="font-bold">{formatCurrency(order.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="order-notes mb-4">
              <h4>Order Notes</h4>
              <div className="notes-card">
                <p>{order.notes}</p>
              </div>
            </div>
          )}

          {/* Status Actions */}
          <div className="status-actions">
            <h4>Update Order Status</h4>
            <div className="btn-group">
              <button 
                className={`btn btn-${status === 'processing' ? 'primary' : 'outline'}`}
                onClick={() => handleStatusUpdate('processing')}
              >
                <FaCheck /> Mark as Processing
              </button>
              <button 
                className={`btn btn-${status === 'shipped' ? 'primary' : 'outline'}`}
                onClick={() => handleStatusUpdate('shipped')}
              >
                <FaTruck /> Mark as Shipped
              </button>
              <button 
                className={`btn btn-${status === 'delivered' ? 'primary' : 'outline'}`}
                onClick={() => handleStatusUpdate('delivered')}
              >
                <FaCheck /> Mark as Delivered
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary">
            <FaPrint /> Print Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
