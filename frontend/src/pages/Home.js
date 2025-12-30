import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import { productService } from '../services/productService';
import { FaArrowRight, FaTruck, FaShieldAlt, FaHeadphones, FaCreditCard } from 'react-icons/fa';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getFeaturedProducts();
      setFeaturedProducts(response?.products || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setError(error.message || 'Failed to load products');
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Format price in Pakistani Rupees
  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Rs 0';
    return 'Rs ' + price.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Safely get hero products
  const heroProducts = featuredProducts.slice(0, 3);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section" style={{
        background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%)',
        color: 'white',
        padding: '4rem 0',
        marginBottom: '3rem'
      }}>
        <div className="container">
          <div className="d-flex align-items-center flex-wrap" style={{ gap: '3rem' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                Welcome to Tech Bazaar
              </h1>
              <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.9 }}>
                Your one-stop destination for the latest electronics, gadgets, and tech accessories.
                Shop with confidence and get the best deals.
              </p>
              <div className="d-flex gap-2">
                <Link to="/products" className="btn btn-primary btn-lg">
                  Shop Now <FaArrowRight />
                </Link>
                <Link to="/categories" className="btn btn-outline btn-lg" style={{ 
                  backgroundColor: 'transparent',
                  borderColor: 'white',
                  color: 'white'
                }}>
                  Browse Categories
                </Link>
              </div>
            </div>
            
            <div style={{ flex: 1, minWidth: '300px' }}>
              {heroProducts.length > 0 ? (
                <div className="d-flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {heroProducts.map(product => {
                    const price = parseFloat(product.price) || 0;
                    return (
                      <div key={product.id} className="card" style={{
                        flex: '1 0 150px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <img 
                          src={product.images?.[0] || 'https://via.placeholder.com/150'} 
                          alt={product.name}
                          style={{
                            width: '100%',
                            height: '150px',
                            objectFit: 'cover',
                            borderRadius: '8px 8px 0 0'
                          }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150';
                          }}
                        />
                        <div className="card-body" style={{ padding: '1rem' }}>
                          <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                            {product.name || 'Product'}
                          </h4>
                          <div style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: 'var(--primary-light)'
                          }}>
                            {formatPrice(price)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <p>No featured products available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Updated for Pakistan */}
      <section className="features-section" style={{ marginBottom: '3rem' }}>
        <div className="container">
          <div className="d-flex justify-content-center flex-wrap" style={{ gap: '2rem' }}>
            {[
              { icon: <FaTruck />, title: 'Free Shipping', desc: 'On orders over Rs 10,000' },
              { icon: <FaShieldAlt />, title: '1 Year Warranty', desc: 'On all products' },
              { icon: <FaHeadphones />, title: '24/7 Support', desc: 'Dedicated customer service' },
              { icon: <FaCreditCard />, title: 'Secure Payment', desc: '100% secure transactions' }
            ].map((feature, index) => (
              <div key={index} className="d-flex align-items-center gap-2" style={{ flex: '1 0 200px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: 'var(--primary-light)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem'
                }}>
                  {feature.icon}
                </div>
                <div>
                  <h4 style={{ marginBottom: '0.25rem' }}>{feature.title}</h4>
                  <p style={{ color: 'var(--secondary-color)', margin: 0 }}>
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products" style={{ marginBottom: '3rem' }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Featured Products</h2>
            <Link to="/products" className="btn btn-outline">
              View All <FaArrowRight />
            </Link>
          </div>

          {loading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-5">
              <h3>No featured products available</h3>
              <p>Check back later for new arrivals!</p>
            </div>
          ) : (
            <div className="row">
              {featuredProducts.map(product => (
                <div key={product.id} className="col-md-4 col-sm-6 mb-4">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section" style={{ marginBottom: '3rem' }}>
        <div className="container">
          <h2 className="text-center mb-4">Popular Categories</h2>
          <p className="text-center text-muted mb-4">
            Explore our wide range of electronic products
          </p>
          <div className="row justify-content-center">
            {[
              { name: 'Smartphones', icon: '📱', link: '/categories' },
              { name: 'Laptops', icon: '💻', link: '/categories' },
              { name: 'Tablets', icon: '📟', link: '/categories' },
              { name: 'Wearables', icon: '⌚', link: '/categories' },
              { name: 'Audio', icon: '🎧', link: '/categories' },
              { name: 'Gaming', icon: '🎮', link: '/categories' }
            ].map((category) => (
              <div key={category.name} className="col-md-2 col-sm-4 col-6 mb-3">
                <Link 
                  to={category.link}
                  className="card text-center h-100"
                  style={{
                    textDecoration: 'none',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div className="card-body">
                    <div style={{
                      fontSize: '2.5rem',
                      marginBottom: '1rem',
                      color: 'var(--primary-color)'
                    }}>
                      {category.icon}
                    </div>
                    <h5 style={{ fontSize: '1rem', margin: 0, color: 'var(--dark-color)' }}>
                      {category.name}
                    </h5>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link to="/categories" className="btn btn-primary">
              View All Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section" style={{
        background: 'linear-gradient(135deg, var(--dark-color) 0%, #1a202c 100%)',
        color: 'white',
        padding: '4rem 0',
        borderRadius: '8px',
        marginBottom: '3rem'
      }}>
        <div className="container text-center">
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            Ready to Shop?
          </h2>
          <p style={{ fontSize: '1.125rem', marginBottom: '2rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2rem' }}>
            Join thousands of satisfied customers who trust Tech Bazaar for their electronic needs.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/products" className="btn btn-primary btn-lg">
              Start Shopping
            </Link>
            <Link to="/register" className="btn btn-outline btn-lg" style={{ 
              backgroundColor: 'transparent',
              borderColor: 'white',
              color: 'white'
            }}>
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;