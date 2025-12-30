import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import { productService } from '../services/productService';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'created_at',
    order: 'DESC',
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts(filters);
      setProducts(response.products);
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productService.getCategories();
      setCategories(response.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'created_at',
      order: 'DESC',
    });
  };

  return (
    <div className="container">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1>Products</h1>
        <button
          className="btn btn-secondary"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> Filters
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="d-flex gap-2">
          <div className="form-group" style={{ flex: 1 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <button className="btn btn-primary">
            <FaSearch />
          </button>
        </div>
      </div>

      <div className="d-flex gap-4">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="card mb-3" style={{ width: '250px' }}>
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Filters</h3>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setShowFilters(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="card-body">
              {/* Category Filter */}
              <div className="mb-4">
                <h4 className="mb-2">Category</h4>
                <div className="d-flex flex-column">
                  <button
                    className={`btn ${filters.category === '' ? 'btn-primary' : 'btn-outline'} mb-1`}
                    onClick={() => handleFilterChange('category', '')}
                  >
                    All Categories
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      className={`btn ${filters.category === category.name ? 'btn-primary' : 'btn-outline'} mb-1`}
                      onClick={() => handleFilterChange('category', category.name)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="mb-4">
                <h4 className="mb-2">Price Range</h4>
                <div className="d-flex gap-2 mb-2">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    min="0"
                  />
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div className="mb-4">
                <h4 className="mb-2">Sort By</h4>
                <select
                  className="form-control"
                  value={`${filters.sortBy}-${filters.order}`}
                  onChange={(e) => {
                    const [sortBy, order] = e.target.value.split('-');
                    handleFilterChange('sortBy', sortBy);
                    handleFilterChange('order', order);
                  }}
                >
                  <option value="created_at-DESC">Newest First</option>
                  <option value="created_at-ASC">Oldest First</option>
                  <option value="price-ASC">Price: Low to High</option>
                  <option value="price-DESC">Price: High to Low</option>
                  <option value="name-ASC">Name: A to Z</option>
                  <option value="name-DESC">Name: Z to A</option>
                </select>
              </div>

              <button
                className="btn btn-outline w-100"
                onClick={clearFilters}
              >
                <FaTimes /> Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-5">
              <h3>No products found</h3>
              <p>Try adjusting your filters</p>
            </div>
          ) : (
            <div className="d-flex flex-wrap" style={{ gap: '1.5rem' }}>
              {products.map(product => (
                <div key={product.id} style={{ flex: '1 0 300px', maxWidth: 'calc(33.333% - 1.5rem)' }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;