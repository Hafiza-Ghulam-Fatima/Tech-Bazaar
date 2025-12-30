const db = require('../config/database');

class Cart {
  static async findByUserId(userId) {
    const result = await db.query(
      `SELECT c.*, p.name, p.price, p.images[1] as image, 
              p.stock_quantity, p.discount_percent
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1 AND p.is_active = true`,
      [userId]
    );
    return result.rows;
  }

  static async addItem(userId, productId, quantity) {
    // Check if item already exists
    const existing = await db.query(
      'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (existing.rows.length > 0) {
      const newQuantity = existing.rows[0].quantity + quantity;
      const result = await db.query(
        'UPDATE cart SET quantity = $1 WHERE id = $2 RETURNING *',
        [newQuantity, existing.rows[0].id]
      );
      return result.rows[0];
    } else {
      const result = await db.query(
        `INSERT INTO cart (user_id, product_id, quantity) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [userId, productId, quantity]
      );
      return result.rows[0];
    }
  }

  static async updateItemQuantity(cartItemId, quantity) {
    if (quantity <= 0) {
      const result = await db.query(
        'DELETE FROM cart WHERE id = $1 RETURNING *',
        [cartItemId]
      );
      return result.rows[0];
    }

    const result = await db.query(
      'UPDATE cart SET quantity = $1 WHERE id = $2 RETURNING *',
      [quantity, cartItemId]
    );
    return result.rows[0];
  }

  static async removeItem(cartItemId) {
    const result = await db.query(
      'DELETE FROM cart WHERE id = $1 RETURNING *',
      [cartItemId]
    );
    return result.rows[0];
  }

  static async clearUserCart(userId) {
    await db.query('DELETE FROM cart WHERE user_id = $1', [userId]);
  }

  static async getCartSummary(userId) {
    const cartItems = await this.findByUserId(userId);
    
    const subtotal = cartItems.reduce((sum, item) => {
      const price = item.price * (1 - (item.discount_percent || 0) / 100);
      return sum + (price * item.quantity);
    }, 0);

    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const total = subtotal + tax + shipping;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      shipping: parseFloat(shipping.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      itemCount: cartItems.length,
    };
  }
}

module.exports = Cart;