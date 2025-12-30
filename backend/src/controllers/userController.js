const db = require('../config/database');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const result = await db.query(
      `SELECT id, username, first_name, last_name, 
              profile_picture, bio, created_at,
              (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count
       FROM users 
       WHERE id = $1 AND is_blocked = false`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user orders
// @route   GET /api/users/:id/orders
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user is accessing their own orders or is admin
    if (userId != req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { page = 1, limit = 10, status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT o.*, 
             COUNT(oi.id) as item_count,
             SUM(oi.total_price) as order_total
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
    `;
    
    const queryParams = [userId];
    let paramCount = 2;
    
    if (status) {
      query += ` AND o.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }
    
    query += ` GROUP BY o.id`;
    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM orders WHERE user_id = $1';
    const countParams = [userId];
    
    if (status) {
      countQuery += ` AND status = $2`;
      countParams.push(status);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      orders: result.rows,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user reviews
// @route   GET /api/users/:id/reviews
// @access  Public
const getUserReviews = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await db.query(
      `SELECT r.*, 
              p.name as product_name,
              p.slug as product_slug,
              pi.image_url as product_image
       FROM reviews r
       JOIN products p ON r.product_id = p.id
       LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    const countResult = await db.query(
      'SELECT COUNT(*) FROM reviews WHERE user_id = $1',
      [userId]
    );
    
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      reviews: result.rows,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        pageSize: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile picture
// @route   PUT /api/users/profile-picture
// @access  Private
const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }
    
    const imagePath = `/uploads/${req.file.filename}`;
    
    const result = await db.query(
      `UPDATE users 
       SET profile_picture = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, email, profile_picture`,
      [imagePath, req.user.id]
    );
    
    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/delete-account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    
    // Get user to verify password
    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // In production, you would verify the password first
    // For now, we'll just delete the account
    
    // Note: In production, you might want to soft delete instead
    await db.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    
    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserProfile,
  getUserOrders,
  getUserReviews,
  updateProfilePicture,
  deleteAccount,
};