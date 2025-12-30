import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';

const AddProduct = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    stock: '', // Keep as 'stock' for frontend, backend will handle conversion
    images: [],
    brand: '',
    discount_percent: 0,
    is_featured: false
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await adminService.getCategories();
      console.log('Categories response:', response);
      setCategories(response.categories || response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Failed to fetch categories');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setProduct(prev => ({ ...prev, [name]: checked }));
    } else {
      setProduct(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Debug: Show what we're sending
      console.log('Product form data:', product);
      
      // Format data for backend
      const productData = {
        name: product.name.trim(),
        description: product.description.trim(),
        price: parseFloat(product.price) || 0,
        category_id: product.category_id ? parseInt(product.category_id) : null,
        stock: product.stock ? parseInt(product.stock) : 0,
        // Clean images array - remove any JSON formatting
        images: Array.isArray(product.images) 
          ? product.images.map(img => {
              // Clean each image URL
              if (typeof img === 'string') {
                return img.replace(/[\[\]\"\{\}]/g, '').trim();
              }
              return img;
            }).filter(url => url && url.trim() !== '')
          : [],
        brand: product.brand?.trim() || '',
        discount_percent: parseFloat(product.discount_percent) || 0,
        is_featured: Boolean(product.is_featured)
      };

      console.log('Sending to backend:', productData);

      // Try to create product
      const response = await adminService.createProduct(productData);
      console.log('Create product response:', response);
      
      alert('Product created successfully!');
      
      // Reset form
      setProduct({
        name: '',
        description: '',
        price: '',
        category_id: '',
        stock: '',
        images: [],
        brand: '',
        discount_percent: 0,
        is_featured: false
      });
    } catch (error) {
      console.error('Full error creating product:', error);
      console.error('Error response:', error.response);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || 
                            error.response.data?.error ||
                            JSON.stringify(error.response.data);
        alert(`Error: ${errorMessage}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('No response from server. Check if backend is running.');
      } else {
        console.error('Request setup error:', error.message);
        alert(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="admin-header">
        <h1>Add New Product</h1>
        <p>Add a new product to your store</p>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Product Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={product.name}
                onChange={handleChange}
                className="form-control"
                required
                placeholder="Enter product name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={product.description}
                onChange={handleChange}
                className="form-control"
                rows="3"
                required
                placeholder="Enter product description"
              />
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label htmlFor="price">Price (Rs.) *</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={product.price}
                    onChange={handleChange}
                    className="form-control"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label htmlFor="stock">Stock Quantity *</label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={product.stock}
                    onChange={handleChange}
                    className="form-control"
                    min="0"
                    required
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label htmlFor="brand">Brand</label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={product.brand}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Enter brand"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="category_id">Category *</label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={product.category_id}
                    onChange={handleChange}
                    className="form-control"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name} (ID: {category.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label htmlFor="discount_percent">Discount %</label>
                  <input
                    type="number"
                    id="discount_percent"
                    name="discount_percent"
                    value={product.discount_percent}
                    onChange={handleChange}
                    className="form-control"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="images">Product Images (URLs, comma separated) *</label>
              <input
                type="text"
                id="images"
                name="images"
                value={product.images.join(', ')}
                onChange={(e) => {
                  const cleanValue = e.target.value.replace(/[\[\]\"\{\}]/g, '');
                  setProduct(prev => ({ 
                    ...prev, 
                    images: cleanValue.split(',').map(url => url.trim()).filter(url => url !== '')
                  }));
                }}
                className="form-control"
                required
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              />
              <small className="form-text text-muted">
                At least one image URL required. Separate multiple URLs with commas.
              </small>
            </div>

            <div className="form-group form-check">
              <input
                type="checkbox"
                id="is_featured"
                name="is_featured"
                checked={product.is_featured}
                onChange={handleChange}
                className="form-check-input"
              />
              <label htmlFor="is_featured" className="form-check-label">
                Featured Product
              </label>
            </div>

            <div className="mt-4">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating...
                  </>
                ) : 'Create Product'}
              </button>
              <button 
                type="button" 
                className="btn btn-outline ml-2"
                onClick={() => window.history.back()}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;