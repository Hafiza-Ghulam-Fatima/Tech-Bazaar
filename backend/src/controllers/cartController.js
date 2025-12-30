const db = require('../config/database');
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await db.query(
      `SELECT c.id, c.quantity, p.id AS product_id, p.name, 
              p.price, p.discount_percent, p.images[1] as image, 
              p.stock_quantity
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1 AND p.is_active = true`,
      [userId]
    );

    const subtotal = rows.reduce((sum, item) => {
      const price = item.price * (1 - (item.discount_percent || 0) / 100);
      return sum + price * item.quantity;
    }, 0);

    const tax = subtotal * 0.1;
    const shipping = subtotal >= 10000 ? 0 : 500;
    const total = subtotal + tax + shipping;

    res.status(200).json({
      cartItems: rows,
      summary: { subtotal, tax, shipping, total },
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.id;

    // Check if product exists and is active
    const productResult = await db.query(
      'SELECT id, stock_quantity, name, price FROM products WHERE id = $1 AND is_active = true',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = productResult.rows[0];

    // Check stock
    if (product.stock_quantity < quantity) {
      return res.status(400).json({ 
        message: `Only ${product.stock_quantity} items available in stock` 
      });
    }

    // Check if item already in cart
    const existingItem = await db.query(
      'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (existingItem.rows.length > 0) {
      // Update quantity
      const newQuantity = existingItem.rows[0].quantity + quantity;
      
      if (newQuantity > product.stock_quantity) {
        return res.status(400).json({ 
          message: `Cannot add more items. Only ${product.stock_quantity} available in stock` 
        });
      }

      const result = await db.query(
        'UPDATE cart SET quantity = $1 WHERE id = $2 RETURNING *',
        [newQuantity, existingItem.rows[0].id]
      );

      return res.json({
        success: true,
        cartItem: result.rows[0],
        message: 'Cart updated successfully',
      });
    } else {
      // Add new item
      const result = await db.query(
        `INSERT INTO cart (user_id, product_id, quantity) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [userId, productId, quantity]
      );

      return res.status(201).json({
        success: true,
        cartItem: result.rows[0],
        message: 'Item added to cart',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:id
// @access  Private
const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;

    // Check if cart item exists and belongs to user
    const cartItemResult = await db.query(
      `SELECT c.*, p.stock_quantity 
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, userId]
    );

    if (cartItemResult.rows.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    const cartItem = cartItemResult.rows[0];

    // Check stock
    if (quantity > cartItem.stock_quantity) {
      return res.status(400).json({ 
        message: `Only ${cartItem.stock_quantity} items available in stock` 
      });
    }

    if (quantity < 1) {
      // Remove item if quantity is 0
      await db.query('DELETE FROM cart WHERE id = $1', [id]);
      return res.json({
        success: true,
        message: 'Item removed from cart',
      });
    }

    // Update quantity
    const result = await db.query(
      'UPDATE cart SET quantity = $1 WHERE id = $2 RETURNING *',
      [quantity, id]
    );

    res.json({
      success: true,
      cartItem: result.rows[0],
      message: 'Cart updated successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if cart item belongs to user
    const result = await db.query(
      'DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query('DELETE FROM cart WHERE user_id = $1', [userId]);

    res.json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};