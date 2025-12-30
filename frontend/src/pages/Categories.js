// Format price in Pakistani Rupees
const formatPrice = (price) => {
  if (!price && price !== 0) return 'Rs 0';
  const numPrice = parseFloat(price);
  return 'Rs ' + numPrice.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import { productService } from '../services/productService';
import { 
  FaMobileAlt, 
  FaLaptop, 
  FaTabletAlt, 
  FaHeadphones, 
  FaGamepad, 
  FaClock,
  FaTv,
  FaCamera,
  FaHome,
  FaMicrochip
} from 'react-icons/fa';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');

  // Map category names to icons
  const categoryIcons = {
    'Smartphones': <FaMobileAlt />,
    'Laptops': <FaLaptop />,
    'Tablets': <FaTabletAlt />,
    'Audio': <FaHeadphones />,
    'Gaming': <FaGamepad />,
    'Wearables': <FaClock />,
    'Monitors': <FaTv />,
    'Cameras': <FaCamera />,
    'Smart Home': <FaHome />,
    'Components': <FaMicrochip />,
  };

  // Default categories if API doesn't return any
  const defaultCategories = [
    { id: '1', name: 'Smartphones', description: 'Latest smartphones from top brands', icon: '📱' },
    { id: '2', name: 'Laptops', description: 'High-performance laptops for work and gaming', icon: '💻' },
    { id: '3', name: 'Tablets', description: 'Portable tablets for entertainment and productivity', icon: '📟' },
    { id: '4', name: 'Wearables', description: 'Smartwatches and fitness trackers', icon: '⌚' },
    { id: '5', name: 'Audio', description: 'Headphones, speakers, and audio accessories', icon: '🎧' },
    { id: '6', name: 'Gaming', description: 'Gaming consoles and accessories', icon: '🎮' },
    { id: '7', name: 'Monitors', description: 'Computer monitors and displays', icon: '🖥️' },
    { id: '8', name: 'Cameras', description: 'DSLR, mirrorless and action cameras', icon: '📷' },
  ];

  useEffect(() => {
    fetchCategoriesAndProducts();
  }, []);

  const fetchCategoriesAndProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      let categoriesData = [];
      try {
        const categoriesResponse = await productService.getCategories();
        categoriesData = categoriesResponse.categories || defaultCategories;
      } catch (err) {
        console.log('Using default categories');
        categoriesData = defaultCategories;
      }
      
      setCategories(categoriesData);
      
      // Fetch products for each category
      const productsByCategory = {};
      for (const category of categoriesData) {
        try {
          // Fetch products filtered by this specific category
          const productsResponse = await productService.getProducts({ 
            category: category.name,
            limit: 8 // Show 8 products per category
          });
          productsByCategory[category.name] = productsResponse.products || [];
        } catch (err) {
          console.log(`No products found for category: ${category.name}`);
          productsByCategory[category.name] = [];
        }
      }
      
      setCategoryProducts(productsByCategory);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load categories and products');
      setCategories(defaultCategories);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryName) => {
    setActiveCategory(categoryName);
    // Scroll to products section
    document.getElementById('category-products')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
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
        <button className="btn btn-primary" onClick={fetchCategoriesAndProducts}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="text-center mb-3">Browse by Category</h1>
      <p className="text-center text-muted mb-5">
        Explore products in specific categories. Click on any category to see its products.
      </p>

      {/* Categories Grid */}
      <div className="row mb-5">
        {categories.map(category => {
          const products = categoryProducts[category.name] || [];
          return (
            <div key={category.id} className="col-md-3 col-sm-6 mb-4">
              <div 
                className={`card text-center h-100 ${activeCategory === category.name ? 'border-primary' : ''}`}
                style={{ 
                  cursor: 'pointer',
                  border: activeCategory === category.name ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  transition: 'all 0.3s ease',
                  backgroundColor: activeCategory === category.name ? '#f0f7ff' : 'white'
                }}
                onClick={() => handleCategoryClick(category.name)}
              >
                <div className="card-body">
                  <div style={{
                    fontSize: '2.5rem',
                    marginBottom: '1rem',
                    color: 'var(--primary-color)'
                  }}>
                    {categoryIcons[category.name] || category.icon || '📦'}
                  </div>
                  <h4 className="card-title mb-2">{category.name}</h4>
                  <p className="card-text text-muted small">
                    {category.description || `Explore ${category.name.toLowerCase()}`}
                  </p>
                  <div className="mt-3">
                    <span className={`badge ${products.length > 0 ? 'badge-primary' : 'badge-secondary'}`}>
                      {products.length} {products.length === 1 ? 'Product' : 'Products'}
                    </span>
                  </div>
                </div>
                <div className="card-footer bg-transparent border-top-0 pt-0">
                  <button 
                    className="btn btn-link btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryClick(category.name);
                    }}
                  >
                    View Products →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Products for selected category */}
      {activeCategory && (
        <div id="category-products" className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">
                <span style={{ marginRight: '10px' }}>
                  {categoryIcons[activeCategory] || '📦'}
                </span>
                {activeCategory} Products
              </h2>
              <p className="text-muted mb-0">
                Browse all products in {activeCategory} category
              </p>
            </div>
            <Link 
              to={`/products?category=${activeCategory.toLowerCase()}`}
              className="btn btn-primary"
            >
              View All {activeCategory}
            </Link>
          </div>
          
          {categoryProducts[activeCategory] && categoryProducts[activeCategory].length > 0 ? (
            <>
              <div className="row">
                {categoryProducts[activeCategory].slice(0, 4).map(product => (
                  <div key={product.id} className="col-md-3 col-sm-6 mb-4">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
              
              {categoryProducts[activeCategory].length > 4 && (
                <div className="text-center mt-4">
                  <div className="alert alert-info">
                    Showing 4 of {categoryProducts[activeCategory].length} products in {activeCategory}
                  </div>
                  <Link 
                    to={`/products?category=${activeCategory.toLowerCase()}`}
                    className="btn btn-outline-primary"
                  >
                    View All {categoryProducts[activeCategory].length} {activeCategory} Products
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <div style={{ fontSize: '4rem', color: 'var(--secondary-color)', marginBottom: '1rem' }}>
                {categoryIcons[activeCategory] || '📦'}
              </div>
              <h4>No products found in {activeCategory}</h4>
              <p className="text-muted mb-4">We'll be adding products to this category soon!</p>
              <Link to="/products" className="btn btn-primary">
                Browse All Products
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Show all categories with their products */}
      {!activeCategory && (
        <div className="mb-5">
          <h2 className="text-center mb-5">All Categories with Products</h2>
          
          {categories.map(category => {
            const products = categoryProducts[category.name] || [];
            if (products.length === 0) return null;
            
            return (
              <div key={category.id} className="mb-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h3 className="mb-1">
                      <span style={{ marginRight: '10px' }}>
                        {categoryIcons[category.name] || category.icon || '📦'}
                      </span>
                      {category.name}
                    </h3>
                    <p className="text-muted mb-0">{category.description}</p>
                  </div>
                  <div>
                    <span className="badge badge-primary mr-2">
                      {products.length} Products
                    </span>
                    <Link 
                      to={`/products?category=${category.name.toLowerCase()}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      View All
                    </Link>
                  </div>
                </div>
                
                <div className="row">
                  {products.slice(0, 4).map(product => (
                    <div key={product.id} className="col-md-3 col-sm-6 mb-4">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
                
                {products.length > 4 && (
                  <div className="text-center mt-3">
                    <Link 
                      to={`/products?category=${category.name.toLowerCase()}`}
                      className="btn btn-link"
                    >
                      Show {products.length - 4} more {category.name.toLowerCase()} →
                    </Link>
                  </div>
                )}
                
                <hr className="my-5" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Categories;