const db = require('../config/database');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const usersCount = await User.count();
    const productsCount = await Product.count({});
    const ordersCount = await Order.count();
    const ordersStats = await Order.getDashboardStats();

    // Get recent orders
    const recentOrders = await Order.findAll(1, 5);

    // Get recent users
    const recentUsers = await User.findAll(1, 5);

    res.json({
      success: true,
      stats: {
        totalUsers: usersCount,
        totalProducts: productsCount,
        totalOrders: ordersCount,
        ...ordersStats,
      },
      recentOrders,
      recentUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    let query = `
      SELECT id, email, first_name, last_name, phone, role, 
             is_verified, is_blocked, created_at 
      FROM users 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (
        email ILIKE $${paramCount} OR 
        first_name ILIKE $${paramCount} OR 
        last_name ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC 
               LIMIT $${paramCount} 
               OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), (page - 1) * limit);

    const result = await db.query(query, params);
    const users = result.rows;

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users ${search ? 'WHERE email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1' : ''}`;
    const countResult = await db.query(
      countQuery, 
      search ? [`%${search}%`] : []
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      users,
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

// @desc    Update user status
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_blocked, is_verified, role } = req.body;

    // Build update object
    const updates = {};
    if (is_blocked !== undefined) updates.is_blocked = is_blocked;
    if (is_verified !== undefined) updates.is_verified = is_verified;
    if (role && ['customer', 'admin', 'moderator'].includes(role)) {
      updates.role = role;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const user = await User.update(id, updates);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.delete(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all products for admin
// @route   GET /api/admin/products
// @access  Private/Admin
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY p.created_at DESC 
               LIMIT $${paramCount} 
               OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), (page - 1) * limit);

    const result = await db.query(query, params);
    const products = result.rows;

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM products ${search ? 'WHERE name ILIKE $1 OR description ILIKE $1' : ''}`;
    const countResult = await db.query(
      countQuery, 
      search ? [`%${search}%`] : []
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      products,
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

// @desc    Create new product
// @route   POST /api/admin/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    // Validate required fields
    const requiredFields = ['name', 'description', 'price', 'category_id'];
    for (const field of requiredFields) {
      if (!productData[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    const product = await Product.create(productData);
    
    res.status(201).json({
      success: true,
      product,
      message: 'Product created successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.update(id, updates);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      success: true,
      product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.delete(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get order details
// @route   GET /api/admin/orders/:id
// @access  Private/Admin
const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get order details
    const orderResult = await db.query(
      `SELECT o.*, u.email as user_email, 
              u.first_name, u.last_name, u.phone
       FROM orders o 
       LEFT JOIN users u ON o.user_id = u.id 
       WHERE o.id = $1`,
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    // Get order items
    const itemsResult = await db.query(
      `SELECT oi.*, p.name, p.image_url 
       FROM order_items oi 
       LEFT JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = $1`,
      [id]
    );
    
    order.items = itemsResult.rows;
    
    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const result = await db.query(
      `UPDATE orders 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({
      success: true,
      order: result.rows[0],
      message: 'Order status updated successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT o.*, u.email as user_email, 
             COUNT(*) OVER() as total_count
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` WHERE o.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    query += ` ORDER BY o.created_at DESC 
               LIMIT $${paramCount} 
               OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);
    
    const result = await db.query(query, params);
    const orders = result.rows;
    const total = orders.length > 0 ? parseInt(orders[0].total_count) : 0;
    
    // Remove total_count from each order
    const cleanedOrders = orders.map(order => {
      const { total_count, ...orderData } = order;
      return orderData;
    });
    
    res.json({
      success: true,
      orders: cleanedOrders,
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

module.exports = {
  getDashboardStats,
  getUsers,
  updateUser,
  deleteUser,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrderDetails,
  updateOrderStatus,
  getOrders,
};