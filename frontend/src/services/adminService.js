import api from './api';

export const adminService = {
  // Dashboard stats
  getDashboardStats: async () => {
    return await api.get('/admin/dashboard');
  },

  // User management
  getAllUsers: async (params = {}) => {
    return await api.get('/admin/users', { params });
  },

  updateUser: async (userId, userData) => {
    return await api.put(`/admin/users/${userId}`, userData);
  },

  deleteUser: async (userId) => {
    return await api.delete(`/admin/users/${userId}`);
  },

  // Product management
  getAllProducts: async (params = {}) => {
    return await api.get('/admin/products', { params });
  },

  getProduct: async (productId) => {
    return await api.get(`/admin/products/${productId}`);
  },

  createProduct: async (productData) => {
    return await api.post('/admin/products', productData);
  },

  updateProduct: async (productId, productData) => {
    return await api.put(`/admin/products/${productId}`, productData);
  },

  deleteProduct: async (productId) => {
    return await api.delete(`/admin/products/${productId}`);
  },

  // Order management
  getAllOrders: async (params = {}) => {
    return await api.get('/admin/orders', { params });
  },

  getOrderDetails: async (orderId) => {
    return await api.get(`/admin/orders/${orderId}`);
  },

  updateOrderStatus: async (orderId, statusData) => {
    return await api.put(`/admin/orders/${orderId}/status`, statusData);
  },

  // Category management - FIXED: Make sure these functions exist
  getCategories: async () => {
    try {
      const response = await api.get('/admin/categories');
      console.log('Categories response:', response);
      return response;
    } catch (error) {
      console.error('Error in getCategories service:', error);
      throw error;
    }
  },

  getCategory: async (categoryId) => {
    return await api.get(`/admin/categories/${categoryId}`);
  },

  createCategory: async (categoryData) => {
    return await api.post('/admin/categories', categoryData);
  },

  updateCategory: async (categoryId, categoryData) => {
    return await api.put(`/admin/categories/${categoryId}`, categoryData);
  },

  deleteCategory: async (categoryId) => {
    try {
      console.log('Deleting category with ID:', categoryId);
      const response = await api.delete(`/admin/categories/${categoryId}`);
      console.log('Delete category response:', response);
      return response;
    } catch (error) {
      console.error('Error in deleteCategory service:', error);
      throw error;
    }
  }
};