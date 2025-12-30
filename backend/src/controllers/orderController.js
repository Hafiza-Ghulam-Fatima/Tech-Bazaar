const db = require('../config/database');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const userId = req.user.id;
    const { shipping_address, payment_method } = req.body;

    // Get user's cart
    const cartItems = await Cart.findByUserId(userId);
    
    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate total and validate stock
    let totalAmount = 0;
    const orderItems = [];

    for (const item of cartItems) {
      const product = await Product.findById(item.product_id);
      
      if (!product) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const discountedPrice = product.price * (1 - (product.discount_percent || 0) / 100);
      const itemTotal = discountedPrice * item.quantity;
      
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: discountedPrice,
        total_price: itemTotal,
      });

      totalAmount += itemTotal;

      // Update product stock
      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
        [item.quantity, product.id]
      );
    }

    // Add tax and shipping
    const tax = totalAmount * 0.1; // 10% tax
    const shipping = totalAmount > 100 ? 0 : 10; // Free shipping over $100
    const finalTotal = totalAmount + tax + shipping;

    // Create order
    const orderData = {
      user_id: userId,
      total_amount: finalTotal,
      shipping_address: JSON.stringify(shipping_address),
      payment_method,
    };

    const order = await Order.create(orderData);
    
    // Add order items
    await Order.addOrderItems(order.id, orderItems);

    // Clear user's cart
    await Cart.clearUserCart(userId);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      order: {
        ...order,
        items: orderItems,
        summary: {
          subtotal: parseFloat(totalAmount.toFixed(2)),
          tax: parseFloat(tax.toFixed(2)),
          shipping: parseFloat(shipping.toFixed(2)),
          total: parseFloat(finalTotal.toFixed(2)),
        },
      },
      message: 'Order created successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create order',
    });
  } finally {
    client.release();
  }
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const orders = await Order.findByUserId(userId, parseInt(page), parseInt(limit));
    
    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM orders WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user (unless admin)
    if (order.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order status (admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.updateStatus(id, status);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      success: true,
      order,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
};