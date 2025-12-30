import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';

const CartContext = createContext({});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});

  const fetchCart = useCallback(async () => {
    try {
      console.log('🛒 CartContext - Fetching cart...');
      setLoading(true);
      const response = await cartService.getCart();
      console.log('🛒 CartContext - Fetched cart:', response);
      setCart(response);
      setError(null);
    } catch (error) {
      console.error('🛒 CartContext - Fetch cart error:', error);
      // Don't show error for empty cart, just set to null
      if (error.response?.status !== 401) {
        setError(error.message);
      }
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = async (productId, quantity = 1) => {
    try {
      console.log('🛒 CartContext - Adding to cart:', { productId, quantity });
      setError(null);
      
      const result = await cartService.addToCart(productId, quantity);
      console.log('🛒 CartContext - Add to cart result:', result);
      
      await fetchCart();
      
      return { 
        success: true, 
        message: result?.message || 'Added to cart successfully' 
      };
    } catch (error) {
      console.error('🛒 CartContext - Add to cart error:', error);
      
      let errorMessage = error.message;
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      return { 
        success: false, 
        message: errorMessage || 'Failed to add item to cart' 
      };
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    try {
      setUpdating(prev => ({ ...prev, [cartItemId]: true }));
      setError(null);
      await cartService.updateCartItem(cartItemId, quantity);
      await fetchCart();
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, message: error.message };
    } finally {
      setUpdating(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      setUpdating(prev => ({ ...prev, [cartItemId]: true }));
      setError(null);
      await cartService.removeFromCart(cartItemId);
      await fetchCart();
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, message: error.message };
    } finally {
      setUpdating(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const clearCart = async () => {
    try {
      setError(null);
      await cartService.clearCart();
      setCart(null);
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, message: error.message };
    }
  };

  const getCartCount = () => {
    const count = cart?.cartItems?.reduce((total, item) => total + item.quantity, 0) || 0;
    return count;
  };

  const getCartTotal = () => {
    return cart?.summary?.total || 0;
  };

  const isUpdating = (cartItemId) => {
    return updating[cartItemId] || false;
  };

  // Auto-refresh cart when component mounts
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('🛒 CartContext - Initial cart fetch');
      fetchCart();
    } else {
      console.log('🛒 CartContext - No token, clearing cart');
      setCart(null);
    }
  }, [fetchCart]);

  const value = {
    cart,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCart,
    getCartCount,
    getCartTotal,
    isUpdating,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};