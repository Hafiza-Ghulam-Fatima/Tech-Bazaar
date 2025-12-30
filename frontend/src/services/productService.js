import api from './api';

export const productService = {
  getProducts: async (params = {}) => {
    return await api.get('/products', { params });
  },

  getProductById: async (id) => {
    return await api.get(`/products/${id}`);
  },

  getFeaturedProducts: async () => {
    return await api.get('/products/featured');
  },

  getCategories: async () => {
    return await api.get('/products/categories');
  },
};