import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    images: [],
    brand: '',
    discount_percent: 0,
    is_featured: false
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllProducts();
      setProducts(response.products || response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminService.getCategories();
      setCategories(response.categories || response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock_quantity || product.stock || 0,
      category_id: product.category_id,
      images: Array.isArray(product.images) 
        ? product.images.map(img => {
            // Clean the URL for display
            if (typeof img === 'string') {
              return img.replace(/[\[\]\"\{\}]/g, '');
            }
            return img;
          })
        : [],
      brand: product.brand || '',
      discount_percent: product.discount_percent || 0,
      is_featured: product.is_featured || false
    });
    setShowEditForm(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setEditFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data for backend
      const productData = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
        price: parseFloat(editFormData.price) || 0,
        stock: editFormData.stock ? parseInt(editFormData.stock) : 0,
        category_id: editFormData.category_id ? parseInt(editFormData.category_id) : null,
        // Clean images array - remove any JSON formatting
        images: Array.isArray(editFormData.images) 
          ? editFormData.images.map(img => {
              // Clean each image URL
              if (typeof img === 'string') {
                return img.replace(/[\[\]\"\{\}]/g, '').trim();
              }
              return img;
            }).filter(url => url && url.trim() !== '')
          : [],
        brand: editFormData.brand?.trim() || '',
        discount_percent: parseFloat(editFormData.discount_percent) || 0,
        is_featured: Boolean(editFormData.is_featured)
      };

      console.log('Sending update data:', productData);
      
      const response = await adminService.updateProduct(editingProduct.id, productData);
      console.log('Update response:', response);
      
      alert('Product updated successfully!');
      fetchProducts();
      setShowEditForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Full update error:', error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert('Failed to update product. Check console for details.');
      }
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await adminService.deleteProduct(productId);
        alert('Product deleted successfully!');
        fetchProducts();
      } catch (error) {
        alert('Failed to delete product');
        console.error('Delete error:', error);
      }
    }
  };

  const formatCurrency = (amount) => {
    return `Rs. ${new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)}`;
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

  return (
    <div className="container">
      <div className="admin-header d-flex justify-content-between align-items-center">
        <div>
          <h1>Product Management</h1>
          <p>Manage all products in your store</p>
        </div>
        <Link to="/admin/products/new" className="btn btn-primary">
          <FaPlus /> Add New Product
        </Link>
      </div>

      {/* Edit Product Modal */}
      {showEditForm && editingProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Product</h3>
              <button className="modal-close" onClick={() => setShowEditForm(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditChange}
                    className="form-control"
                    rows="3"
                    required
                  />
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Price (Rs.) *</label>
                      <input
                        type="number"
                        name="price"
                        value={editFormData.price}
                        onChange={handleEditChange}
                        className="form-control"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Stock Quantity *</label>
                      <input
                        type="number"
                        name="stock"
                        value={editFormData.stock}
                        onChange={handleEditChange}
                        className="form-control"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category_id"
                    value={editFormData.category_id}
                    onChange={handleEditChange}
                    className="form-control"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Images (URLs, comma separated) *</label>
                  <input
                    type="text"
                    name="images"
                    value={Array.isArray(editFormData.images) 
                      ? editFormData.images.map(img => {
                          // Clean the URL for display
                          if (typeof img === 'string') {
                            return img.replace(/[\[\]\"\{\}]/g, '').trim();
                          }
                          return img;
                        }).join(', ')
                      : editFormData.images || ''}
                    onChange={(e) => {
                      const cleanValue = e.target.value.replace(/[\[\]\"\{\}]/g, '');
                      setEditFormData(prev => ({
                        ...prev,
                        images: cleanValue.split(',').map(url => url.trim()).filter(url => url)
                      }));
                    }}
                    className="form-control"
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    required
                  />
                  <small className="form-text text-muted">
                    Separate multiple URLs with commas. At least one image required.
                  </small>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Brand</label>
                      <input
                        type="text"
                        name="brand"
                        value={editFormData.brand}
                        onChange={handleEditChange}
                        className="form-control"
                        placeholder="Enter brand"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Discount %</label>
                      <input
                        type="number"
                        name="discount_percent"
                        value={editFormData.discount_percent}
                        onChange={handleEditChange}
                        className="form-control"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group form-check">
                  <input
                    type="checkbox"
                    id="is_featured"
                    name="is_featured"
                    checked={editFormData.is_featured}
                    onChange={handleEditChange}
                    className="form-check-input"
                  />
                  <label htmlFor="is_featured" className="form-check-label">
                    Featured Product
                  </label>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowEditForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      {product.images && product.images[0] && (
                        <img 
                          src={Array.isArray(product.images) ? product.images[0] : product.images} 
                          alt={product.name}
                          style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px', borderRadius: '4px' }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/50';
                          }}
                        />
                      )}
                      <div>
                        <strong>{product.name}</strong>
                        <div className="text-muted small">
                          {product.description?.substring(0, 50)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {product.category_name || categories.find(cat => cat.id === product.category_id)?.name || 'Uncategorized'}
                  </td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>
                    <span className={`badge ${(product.stock_quantity || product.stock) > 0 ? 'badge-success' : 'badge-danger'}`}>
                      {product.stock_quantity || product.stock || 0}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${product.is_active ? 'badge-success' : 'badge-secondary'}`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => handleEditClick(product)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteProduct(product.id)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted">No products found</p>
              <Link to="/admin/products/new" className="btn btn-primary">
                <FaPlus /> Add Your First Product
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;