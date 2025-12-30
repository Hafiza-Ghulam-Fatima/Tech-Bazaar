const db = require('../config/database');

class Order {
  static async create(orderData) {
    const { user_id, total_amount, shipping_address, payment_method } = orderData;
    const order_number = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const result = await db.query(
      `INSERT INTO orders (user_id, order_number, total_amount, shipping_address, payment_method) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [user_id, order_number, total_amount, shipping_address, payment_method]
    );
    return result.rows[0];
  }

  static async addOrderItems(orderId, items) {
    const query = `
      INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) 
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    for (const item of items) {
      await db.query(query, [
        orderId,
        item.product_id,
        item.product_name,
        item.quantity,
        item.unit_price,
        item.total_price,
      ]);
    }
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT o.*, 
              json_agg(
                json_build_object(
                  'id', oi.id,
                  'product_id', oi.product_id,
                  'product_name', oi.product_name,
                  'quantity', oi.quantity,
                  'unit_price', oi.unit_price,
                  'total_price', oi.total_price
                )
              ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    );
    return result.rows[0];
  }

  static async findByUserId(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const result = await db.query(
      `SELECT * FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async findAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const result = await db.query(
      `SELECT o.*, u.email, u.first_name, u.last_name 
       FROM orders o 
       JOIN users u ON o.user_id = u.id 
       ORDER BY o.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async updateStatus(id, status) {
    const result = await db.query(
      `UPDATE orders 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  static async count() {
    const result = await db.query('SELECT COUNT(*) FROM orders');
    return parseInt(result.rows[0].count);
  }

  static async getDashboardStats() {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(total_amount) as total_revenue
      FROM orders
    `);
    return result.rows[0];
  }
}

module.exports = Order;