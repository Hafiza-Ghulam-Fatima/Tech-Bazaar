import api from './api';

export const orderService = {
  // Create new order
  createOrder: async (orderData) => {
    return await api.post('/orders', orderData);
  },

  // Get user orders
  getUserOrders: async (params = {}) => {
    return await api.get('/orders', { params });
  },

  // Get order by ID
  getOrderById: async (id) => {
    return await api.get(`/orders/${id}`);
  },

  // Update order status (admin only)
  updateOrderStatus: async (orderId, status) => {
    return await api.put(`/orders/${orderId}/status`, { status });
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    return await api.put(`/orders/${orderId}/cancel`);
  },
  
  // Optional: You might want to add a check if order can be cancelled
  canCancelOrder: (order) => {
    return order.status === 'pending' || order.status === 'processing';
  }
};