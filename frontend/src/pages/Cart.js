import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FaTrash, FaPlus, FaMinus, FaShoppingCart, FaArrowRight } from 'react-icons/fa';

const Cart = () => {
  const { 
    cart, 
    loading, 
    error, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    fetchCart,
    isUpdating 
  } = useCart();
  
  const navigate = useNavigate();

  // Format price in Pakistani Rupees
  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Rs. 0';
    const numPrice = parseFloat(price);
    return 'Rs. ' + numPrice.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      // If quantity becomes 0, remove the item
      await handleRemoveItem(cartItemId);
      return;
    }

    try {
      await updateQuantity(cartItemId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    if (window.confirm('Are you sure you want to remove this item from your cart?')) {
      try {
        await removeFromCart(cartItemId);
      } catch (error) {
        console.error('Error removing item:', error);
        alert('Failed to remove item from cart');
      }
    }
  };

  const handleIncrement = (cartItemId, currentQuantity) => {
    handleQuantityChange(cartItemId, currentQuantity + 1);
  };

  const handleDecrement = (cartItemId, currentQuantity) => {
    if (currentQuantity > 1) {
      handleQuantityChange(cartItemId, currentQuantity - 1);
    } else {
      handleRemoveItem(cartItemId);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await clearCart();
      } catch (error) {
        console.error('Error clearing cart:', error);
        alert('Failed to clear cart');
      }
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading && !cart) {
    return (
      <div className="container">
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={fetchCart}>
          Try Again
        </button>
      </div>
    );
  }

  if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
    return (
      <div className="container">
        <div className="text-center py-5">
          <FaShoppingCart style={{ fontSize: '4rem', color: 'var(--secondary-color)', marginBottom: '1rem' }} />
          <h2>Your cart is empty</h2>
          <p className="mb-4">Looks like you haven't added any products to your cart yet.</p>
          <Link to="/products" className="btn btn-primary btn-lg">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="mb-4">Shopping Cart</h1>

      <div className="d-flex flex-wrap" style={{ gap: '2rem' }}>
        {/* Cart Items */}
        <div style={{ flex: '1 0 300px' }}>
          <div className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h2 className="mb-0">Items ({cart.cartItems.length})</h2>
              <button
                className="btn btn-sm btn-danger"
                onClick={handleClearCart}
                disabled={loading}
              >
                <FaTrash /> Clear Cart
              </button>
            </div>
            
            <div className="card-body p-0">
              {cart.cartItems.map(item => {
                const itemTotal = (item.discounted_price || item.price) * item.quantity;
                const isItemUpdating = isUpdating(item.id);
                
                return (
                  <div key={item.id} className="cart-item" style={{
                    display: 'flex',
                    padding: '1rem',
                    borderBottom: '1px solid #eee',
                    opacity: isItemUpdating ? 0.6 : 1,
                    transition: 'opacity 0.3s'
                  }}>
                    <div className="cart-item-image" style={{
                      width: '100px',
                      height: '100px',
                      marginRight: '1rem',
                      flexShrink: 0
                    }}>
                      <img 
                        src={item.image || 'https://via.placeholder.com/100x100?text=No+Image'} 
                        alt={item.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                      />
                    </div>
                    
                    <div className="cart-item-details" style={{ flex: 1 }}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h3 className="cart-item-title" style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                            <Link to={`/products/${item.product_id}`}>
                              {item.name}
                            </Link>
                          </h3>
                          {item.discount_percent > 0 && (
                            <div className="mb-2">
                              <span className="badge badge-danger mr-2" style={{
                                backgroundColor: '#dc3545',
                                color: 'white',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px'
                              }}>
                                -{item.discount_percent}% OFF
                              </span>
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="cart-item-price mb-2" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {formatPrice(itemTotal)}
                          </div>
                          {item.discount_percent > 0 && (
                            <div style={{ 
                              fontSize: '0.875rem', 
                              color: '#6c757d',
                              textDecoration: 'line-through'
                            }}>
                              {formatPrice(item.price * item.quantity)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="cart-item-actions" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '1rem'
                      }}>
                        <div className="quantity-control" style={{ display: 'flex', alignItems: 'center' }}>
                          <button
                            className="quantity-btn"
                            onClick={() => handleDecrement(item.id, item.quantity)}
                            disabled={isItemUpdating || item.quantity <= 1}
                            style={{
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #dee2e6',
                              background: 'white',
                              borderRadius: '4px 0 0 4px',
                              cursor: isItemUpdating || item.quantity <= 1 ? 'not-allowed' : 'pointer',
                              opacity: isItemUpdating || item.quantity <= 1 ? 0.5 : 1
                            }}
                          >
                            <FaMinus size={12} />
                          </button>
                          <span className="quantity-display" style={{
                            padding: '0 12px',
                            borderTop: '1px solid #dee2e6',
                            borderBottom: '1px solid #dee2e6',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '40px'
                          }}>
                            {isItemUpdating ? (
                              <span className="spinner" style={{ 
                                width: '16px', 
                                height: '16px',
                                border: '2px solid #f3f3f3',
                                borderTop: '2px solid #3498db',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                display: 'inline-block'
                              }}></span>
                            ) : (
                              item.quantity
                            )}
                          </span>
                          <button
                            className="quantity-btn"
                            onClick={() => handleIncrement(item.id, item.quantity)}
                            disabled={isItemUpdating || item.quantity >= item.stock_quantity}
                            style={{
                              width: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #dee2e6',
                              background: 'white',
                              borderRadius: '0 4px 4px 0',
                              cursor: isItemUpdating || item.quantity >= item.stock_quantity ? 'not-allowed' : 'pointer',
                              opacity: isItemUpdating || item.quantity >= item.stock_quantity ? 0.5 : 1
                            }}
                          >
                            <FaPlus size={12} />
                          </button>
                        </div>
                        
                        <button
                          className="remove-item"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isItemUpdating}
                          style={{
                            background: 'none',
                            border: '1px solid #dc3545',
                            color: '#dc3545',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '4px',
                            cursor: isItemUpdating ? 'not-allowed' : 'pointer',
                            opacity: isItemUpdating ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <FaTrash size={14} /> Remove
                        </button>
                      </div>
                      
                      {item.stock_quantity < item.quantity && (
                        <div className="alert alert-danger mt-2" style={{ 
                          fontSize: '0.875rem',
                          padding: '0.5rem',
                          marginTop: '0.5rem'
                        }}>
                          Only {item.stock_quantity} items available in stock
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div style={{ flex: '0 0 350px' }}>
          <div className="order-summary" style={{
            background: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h2 className="summary-title" style={{ marginBottom: '1.5rem' }}>Order Summary</h2>
            
            <div className="mb-4">
              <div className="summary-row" style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <span>Subtotal</span>
                <span>{formatPrice(cart.summary?.subtotal || 0)}</span>
              </div>
              <div className="summary-row" style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <span>Tax (10%)</span>
                <span>{formatPrice(cart.summary?.tax || 0)}</span>
              </div>
              <div className="summary-row" style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <span>Shipping</span>
                <span>
                  {cart.summary?.shipping === 0 ? 'FREE' : formatPrice(cart.summary?.shipping || 0)}
                </span>
              </div>
              <div className="summary-row total" style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #dee2e6',
                fontWeight: 'bold',
                fontSize: '1.2rem'
              }}>
                <span>Total</span>
                <span>{formatPrice(cart.summary?.total || 0)}</span>
              </div>
              
              {cart.summary?.subtotal < 10000 && (
                <div className="alert alert-info mt-3" style={{
                  padding: '0.75rem',
                  background: '#d1ecf1',
                  color: '#0c5460',
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}>
                  Add {formatPrice(10000 - (cart.summary?.subtotal || 0))} more to get free shipping!
                </div>
              )}
            </div>
            
            <button
              className="btn btn-primary btn-block btn-lg"
              onClick={handleCheckout}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1.1rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Proceed to Checkout <FaArrowRight />
            </button>
            
            <div className="text-center mt-3">
              <Link to="/products" className="btn btn-outline" style={{
                padding: '0.5rem 1rem',
                border: '1px solid #6c757d',
                color: '#6c757d',
                background: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
                display: 'inline-block'
              }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;