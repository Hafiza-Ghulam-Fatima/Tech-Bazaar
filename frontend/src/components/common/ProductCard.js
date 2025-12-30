import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { FaStar, FaStarHalfAlt, FaRegStar, FaShoppingCart, FaHeart, FaEye, FaExclamationTriangle } from 'react-icons/fa';
import '../../styles/components.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [addingToCart, setAddingToCart] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  // Check if user is logged in
  const isLoggedIn = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return !!(token && user);
  };

  const handleAddToCart = async () => {
    // Check if user is logged in
    if (!isLoggedIn()) {
      setShowLoginAlert(true);
      return;
    }

    // Check if product is in stock
    const stockQuantity = parseInt(product.stock_quantity) || 0;
    if (stockQuantity === 0) {
      alert('This product is out of stock!');
      return;
    }

    setAddingToCart(true);
    try {
      const result = await addToCart(product.id, 1);
      if (result.success) {
        // You can show a toast notification here
        console.log('Product added to cart successfully!');
      } else {
        alert(result.message || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('An error occurred while adding to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleLoginRedirect = () => {
    // Save the current URL to redirect back after login
    const currentPath = window.location.pathname;
    navigate('/login', { 
      state: { 
        from: currentPath,
        message: 'Please login to add items to your cart'
      } 
    });
    setShowLoginAlert(false);
  };

  const handleContinueShopping = () => {
    setShowLoginAlert(false);
  };

  // Format price in Pakistani Rupees
  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Rs. 0';
    const numPrice = parseFloat(price);
    return 'Rs. ' + numPrice.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Safely calculate discounted price
  const calculateDiscountedPrice = () => {
    try {
      const price = parseFloat(product.price) || 0;
      const discountPercent = parseFloat(product.discount_percent) || 0;
      
      if (discountPercent > 0) {
        return price * (1 - discountPercent / 100);
      }
      return price;
    } catch (error) {
      console.error('Error calculating discounted price:', error);
      return parseFloat(product.price) || 0;
    }
  };

  const discountedPrice = calculateDiscountedPrice();
  const originalPrice = parseFloat(product.price) || 0;
  const discountPercent = parseFloat(product.discount_percent) || 0;

  // Render star rating safely
  const renderStars = (rating) => {
    const stars = [];
    const numericRating = parseFloat(rating) || 0;
    const fullStars = Math.floor(numericRating);
    const halfStar = numericRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="star-icon" />);
    }
    if (halfStar) {
      stars.push(<FaStarHalfAlt key="half" className="star-icon" />);
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="star-icon" />);
    }

    return stars;
  };

  // Get stock quantity safely
  const stockQuantity = parseInt(product.stock_quantity) || 0;

  return (
    <>
      <div className="product-card">
        <div className="product-image">
          <img 
            src={product.images?.[0] || 'https://via.placeholder.com/300x200?text=No+Image'} 
            alt={product.name}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
            }}
          />
          <div className="product-badges">
            {product.is_featured && <span className="badge badge-primary">Featured</span>}
            {discountPercent > 0 && (
              <span className="badge badge-danger">-{discountPercent}%</span>
            )}
          </div>
        </div>

        <div className="product-content">
          <div className="product-category">{product.category_name || 'Uncategorized'}</div>
          <h3 className="product-title">
            <Link to={`/products/${product.id}`}>{product.name || 'Unnamed Product'}</Link>
          </h3>
          <p className="product-description">
            {product.description ? product.description.substring(0, 100) + '...' : 'No description available'}
          </p>
          
          <div className="product-price">
            <span className="current-price">{formatPrice(discountedPrice)}</span>
            {discountPercent > 0 && (
              <>
                <span className="original-price">{formatPrice(originalPrice)}</span>
                <span className="discount">Save {formatPrice(originalPrice - discountedPrice)}</span>
              </>
            )}
          </div>

          <div className="product-rating">
            <div className="stars">
              {renderStars(product.avg_rating)}
            </div>
            <span className="rating-count">
              ({parseInt(product.review_count) || 0} reviews)
            </span>
          </div>

          <div className="product-actions">
            <button 
              className="btn btn-primary"
              onClick={handleAddToCart}
              disabled={addingToCart || stockQuantity === 0}
            >
              <FaShoppingCart /> {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
            <button className="btn btn-outline">
              <FaHeart />
            </button>
            <Link to={`/products/${product.id}`} className="btn btn-outline">
              <FaEye />
            </Link>
          </div>

          {stockQuantity === 0 && (
            <div className="alert alert-danger mt-2">Out of Stock</div>
          )}
          {stockQuantity > 0 && stockQuantity < 10 && (
            <div className="alert alert-warning mt-2">
              Only {stockQuantity} left in stock!
            </div>
          )}
        </div>
      </div>

      {/* Login Alert Modal */}
      {showLoginAlert && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <div className="modal-header" style={{ 
              display: 'flex', 
              alignItems: 'center',
              marginBottom: '1rem' 
            }}>
              <FaExclamationTriangle style={{ 
                color: '#ffc107', 
                fontSize: '1.5rem',
                marginRight: '0.5rem' 
              }} />
              <h3 style={{ margin: 0 }}>Login Required</h3>
            </div>
            
            <div className="modal-body" style={{ marginBottom: '1.5rem' }}>
              <p>You need to be logged in to add items to your cart.</p>
              <p>Would you like to login now?</p>
            </div>
            
            <div className="modal-footer" style={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              gap: '0.5rem'
            }}>
              <button 
                className="btn btn-outline"
                onClick={handleContinueShopping}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #6c757d',
                  background: 'white',
                  color: '#6c757d',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Continue Shopping
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleLoginRedirect}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Login Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;