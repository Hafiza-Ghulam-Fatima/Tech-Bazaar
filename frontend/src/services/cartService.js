import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const cartService = {
  getCart: async () => {
    const res = await API.get('/cart');
    return res.data;
  },

  addToCart: async (productId, quantity = 1) => {
    const res = await API.post('/cart', { productId, quantity });
    return res.data;
  },

  // Renamed from updateCartItem to updateQuantity
  updateCartItem: async (itemId, quantity) => {
    const res = await API.put(`/cart/${itemId}`, { quantity });
    return res.data;
  },

  // Renamed from removeItem to removeFromCart
  removeFromCart: async (itemId) => {
    const res = await API.delete(`/cart/${itemId}`);
    return res.data;
  },

  clearCart: async () => {
    const res = await API.delete('/cart');
    return res.data;
  }
};