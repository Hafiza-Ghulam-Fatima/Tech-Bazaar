import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await adminService.getCategories();
      setCategories(response.categories || response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare category data
      const categoryData = {
        name: categoryForm.name.trim(),
        description: categoryForm.description?.trim() || ''
      };

      console.log('Sending category data:', categoryData);

      if (editingCategory) {
        // Update existing category
        const response = await adminService.updateCategory(editingCategory.id, categoryData);
        console.log('Update response:', response);
        alert('Category updated successfully!');
      } else {
        // Create new category
        const response = await adminService.createCategory(categoryData);
        console.log('Create response:', response);
        alert('Category created successfully!');
      }
      
      fetchCategories();
      resetForm();
    } catch (error) {
      console.error('Category error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error';
      alert(`Error: ${errorMsg}`);
    }
  };

  const handleEditClick = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setCategoryForm({ name: '', description: '' });
    setEditingCategory(null);
    setShowForm(false);
  };

  const getProductCount = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.product_count || 0;
  };

  if (loading && categories.length === 0) {
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
      <div className="admin-header">
        <h1>Manage Categories</h1>
        <p>Add and manage product categories</p>
      </div>

      <div className="mb-4 d-flex justify-content-between align-items-center">
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancel' : 'Add New Category'}
        </button>
        {categories.length > 0 && (
          <div className="text-muted">
            Total Categories: {categories.length}
          </div>
        )}
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h3>{editingCategory ? 'Edit Category' : 'Create New Category'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Category Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={categoryForm.name}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                  placeholder="e.g., Electronics, Clothing"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={categoryForm.description}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="3"
                  placeholder="Describe this category..."
                />
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-success">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
                <button type="button" className="btn btn-outline" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body p-0">
          {categories.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Products</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => {
                  const productCount = getProductCount(category.id);
                  
                  return (
                    <tr key={category.id}>
                      <td>{category.id}</td>
                      <td>
                        <strong>{category.name}</strong>
                        {category.slug && (
                          <div className="text-muted small">/{category.slug}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ maxWidth: '300px' }}>
                          {category.description || 'No description'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${productCount > 0 ? 'badge-info' : 'badge-secondary'}`}>
                          {productCount} product{productCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td>
                        {/* Only Edit button remains */}
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEditClick(category)}
                          title="Edit category"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted">No categories found</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                Create Your First Category
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageCategories;