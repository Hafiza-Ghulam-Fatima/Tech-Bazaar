import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FaStar, FaShoppingCart, FaHeart, FaTruck, FaShieldAlt, FaUndo, FaArrowLeft } from 'react-icons/fa';
import ProductCard from '../components/common/ProductCard';
import { productService } from '../services/productService';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('description');
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);

  // Safe number parsing
  const safeParseNumber = (value, defaultValue = 0) => {
    if (value === null || value === undefined || value === '') return defaultValue;
    if (typeof value === 'number') return value;
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Safe price formatting for PKR
  const formatPrice = (price) => {
    const numPrice = safeParseNumber(price);
    return 'Rs ' + numPrice.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productService.getProductById(id);
      console.log('Product API Response:', response);
      
      // Extract product data from response
      let productData;
      if (response && response.product) {
        productData = response.product;
      } else if (response && response.id) {
        productData = response;
      } else {
        throw new Error('Invalid product data structure');
      }
      
      // Ensure all numeric fields are properly parsed
      const processedProduct = {
        ...productData,
        id: productData.id || id,
        name: productData.name || 'Product Name',
        description: productData.description || 'No description available',
        price: safeParseNumber(productData.price),
        discount_percent: safeParseNumber(productData.discount_percent),
        old_price: safeParseNumber(productData.old_price),
        stock_quantity: parseInt(productData.stock_quantity) || 0,
        avg_rating: safeParseNumber(productData.avg_rating, 0),
        review_count: parseInt(productData.review_count) || 0,
        category_name: productData.category_name || 'Uncategorized',
        images: productData.images || [],
        specifications: productData.specifications || {},
        is_featured: Boolean(productData.is_featured),
      };
      
      console.log('Processed Product:', processedProduct);
      setProduct(processedProduct);
      
      // Set related products if available
      if (response.relatedProducts) {
        setRelatedProducts(response.relatedProducts);
      }
      
      // Set reviews if available
      if (response.reviews) {
        setReviews(response.reviews);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to load product details. Please try again.');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = async () => {
    console.log('Add to cart clicked');
    
    if (!isAuthenticated) {
      alert('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (!product || !product.id) {
      console.error('No product ID available');
      alert('Product information is not available');
      return;
    }

    setAddingToCart(true);
    try {
      console.log('Calling addToCart with:', { 
        productId: product.id, 
        quantity: quantity 
      });
      
      const result = await addToCart(product.id, quantity);
      
      console.log('Add to cart result:', result);
      
      if (result && result.success) {
        alert(`${product.name} added to cart successfully!`);
      } else {
        const errorMsg = result?.message || 'Failed to add to cart. Please try again.';
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Error in handleAddToCart:', error);
      alert(`Error: ${error.message || 'Please try again'}`);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      alert('Please login to add items to wishlist');
      navigate('/login');
      return;
    }

    setAddingToWishlist(true);
    try {
      alert('Added to wishlist!');
      // Add wishlist API call here
    } catch (error) {
      alert('Failed to add to wishlist');
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const result = await addToCart(product.id, quantity);
      if (result && result.success) {
        navigate('/cart');
      } else {
        alert('Failed to add to cart');
      }
    } catch (error) {
      alert('Failed to add to cart');
    }
  };

  const renderStars = (rating) => {
    const numericRating = safeParseNumber(rating, 0);
    const fullStars = Math.floor(numericRating);
    const halfStar = numericRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    const stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} style={{ color: '#fbbf24' }} />);
    }
    if (halfStar) {
      stars.push(<FaStar key="half" style={{ color: '#fbbf24' }} />);
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} style={{ color: '#d1d5db' }} />);
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner-container">
          <div className="spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container">
        <div className="alert alert-danger">{error || 'Product not found'}</div>
        <button className="btn btn-primary" onClick={() => navigate('/products')}>
          <FaArrowLeft /> Back to Products
        </button>
      </div>
    );
  }

  // Calculate prices safely
  const originalPrice = safeParseNumber(product.price);
  const discountPercent = safeParseNumber(product.discount_percent);
  const discountedPrice = discountPercent > 0 
    ? originalPrice * (1 - discountPercent / 100)
    : originalPrice;
  
  const stockQuantity = parseInt(product.stock_quantity) || 0;

  return (
    <div className="container">
      {/* Breadcrumb */}
      <nav className="mb-4">
        <button 
          className="btn btn-outline"
          onClick={() => navigate('/products')}
        >
          <FaArrowLeft /> Back to Products
        </button>
      </nav>

      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex flex-wrap" style={{ gap: '2rem' }}>
            {/* Product Images */}
            <div style={{ flex: '1 0 300px' }}>
              <div style={{ 
                width: '100%', 
                height: '400px',
                overflow: 'hidden',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <img 
                  src={product.images?.[selectedImage] || 'https://via.placeholder.com/400x400?text=No+Image'} 
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                  }}
                />
              </div>
              
              {product.images && product.images.length > 1 && (
                <div className="d-flex gap-2" style={{ overflowX: 'auto' }}>
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      style={{
                        flex: '0 0 80px',
                        height: '80px',
                        padding: 0,
                        border: selectedImage === index ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        background: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <img 
                        src={image} 
                        alt={`${product.name} ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/80x80?text=No+Image';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div style={{ flex: '1 0 300px' }}>
              <div className="mb-3">
                <span className="badge badge-secondary">{product.category_name}</span>
                {product.is_featured && (
                  <span className="badge badge-primary ml-2">Featured</span>
                )}
                {discountPercent > 0 && (
                  <span className="badge badge-danger ml-2">-{discountPercent}% OFF</span>
                )}
              </div>

              <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                {product.name}
              </h1>

              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="d-flex align-items-center">
                  {renderStars(product.avg_rating)}
                  <span className="ml-2" style={{ color: 'var(--secondary-color)' }}>
                    ({product.review_count} reviews)
                  </span>
                </div>
                <span style={{ color: stockQuantity > 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                  {stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              <div className="mb-4">
                <div className="d-flex align-items-center gap-3">
                  <span style={{ 
                    fontSize: '2rem', 
                    fontWeight: 'bold',
                    color: 'var(--primary-color)'
                  }}>
                    {formatPrice(discountedPrice)}
                  </span>
                  {discountPercent > 0 && (
                    <>
                      <span style={{
                        fontSize: '1.25rem',
                        color: 'var(--secondary-color)',
                        textDecoration: 'line-through'
                      }}>
                        {formatPrice(originalPrice)}
                      </span>
                      <span className="badge badge-danger">
                        Save {formatPrice(originalPrice - discountedPrice)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <p style={{ fontSize: '1.125rem', marginBottom: '2rem' }}>
                {product.description}
              </p>

              {/* Quantity Selector */}
              <div className="mb-4">
                <label className="form-label mb-2">Quantity</label>
                <div className="d-flex align-items-center gap-2" style={{ maxWidth: '150px' }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="form-control text-center"
                    value={quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      const maxQty = Math.min(stockQuantity, 99);
                      setQuantity(Math.max(1, Math.min(value, maxQty)));
                    }}
                    min="1"
                    max={stockQuantity}
                  />
                  <button
                    className="btn btn-outline"
                    onClick={() => setQuantity(prev => Math.min(stockQuantity, prev + 1))}
                    disabled={quantity >= stockQuantity}
                  >
                    +
                  </button>
                </div>
                {stockQuantity > 0 && (
                  <small className="text-muted">
                    {stockQuantity} items available
                  </small>
                )}
              </div>

              <div className="d-flex gap-2 mb-4">
                <button
                  className="btn btn-primary"
                  onClick={handleAddToCart}
                  disabled={stockQuantity === 0 || addingToCart}
                  style={{ flex: 1 }}
                >
                  <FaShoppingCart /> 
                  {addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleBuyNow}
                  disabled={stockQuantity === 0}
                >
                  Buy Now
                </button>
                <button
                  className="btn btn-outline"
                  onClick={handleAddToWishlist}
                  disabled={addingToWishlist}
                >
                  <FaHeart />
                </button>
              </div>

              {/* Features */}
              <div className="d-flex flex-wrap gap-3 mb-4">
                <div className="d-flex align-items-center gap-2">
                  <FaTruck style={{ color: 'var(--primary-color)' }} />
                  <small>Free shipping over Rs 10,000</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <FaShieldAlt style={{ color: 'var(--primary-color)' }} />
                  <small>1-year warranty</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <FaUndo style={{ color: 'var(--primary-color)' }} />
                  <small>30-day returns</small>
                </div>
              </div>

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="mb-4">
                  <h3>Specifications</h3>
                  <div className="card">
                    <div className="card-body">
                      <table className="w-100">
                        <tbody>
                          {Object.entries(product.specifications).map(([key, value]) => (
                            <tr key={key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '8px', fontWeight: '500' }}>{key}</td>
                              <td style={{ padding: '8px' }}>{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-4">
        <div className="card-header">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'description' ? 'active' : ''}`}
                onClick={() => setActiveTab('description')}
              >
                Description
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews ({product.review_count})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'shipping' ? 'active' : ''}`}
                onClick={() => setActiveTab('shipping')}
              >
                Shipping & Returns
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          {activeTab === 'description' && (
            <div>
              <h4>Product Description</h4>
              <p>{product.description}</p>
            </div>
          )}
          
          {activeTab === 'reviews' && (
            <div>
              <h4>Customer Reviews</h4>
              {reviews.length === 0 ? (
                <p>No reviews yet. Be the first to review this product!</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {reviews.map(review => (
                    <div key={review.id} className="card">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h5 className="mb-1">{review.first_name} {review.last_name}</h5>
                            <div className="d-flex align-items-center">
                              {renderStars(review.rating)}
                              <span className="ml-2 text-muted">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                            {safeParseNumber(review.rating)}.0
                          </span>
                        </div>
                        {review.comment && (
                          <p className="mb-0">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'shipping' && (
            <div>
              <h4>Shipping & Returns</h4>
              <div className="row">
                <div className="col-md-6">
                  <h5>Shipping Information</h5>
                  <ul>
                    <li>Free standard shipping on orders over Rs 10,000</li>
                    <li>Orders processed within 1-2 business days</li>
                    <li>Delivery time: 3-7 business days</li>
                    <li>Track your order from your account</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h5>Returns & Refunds</h5>
                  <ul>
                    <li>30-day return policy from delivery date</li>
                    <li>Products must be in original condition</li>
                    <li>Free returns for defective products</li>
                    <li>Refunds processed within 5-7 business days</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="mb-0">Related Products</h3>
          </div>
          <div className="card-body">
            <div className="row">
              {relatedProducts.map(relatedProduct => (
                <div key={relatedProduct.id} className="col-md-3 col-sm-6 mb-4">
                  <ProductCard product={relatedProduct} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;