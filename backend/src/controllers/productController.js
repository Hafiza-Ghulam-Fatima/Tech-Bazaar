const db = require('../config/database');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      minPrice,
      maxPrice,
      brand,
      search,
      sortBy = 'created_at',
      order = 'DESC',
    } = req.query;

    let query = `
      SELECT p.*, c.name as category_name, 
      COALESCE(p.images[1], 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853') as primary_image,
      COALESCE(
        (SELECT ROUND(AVG(rating), 1) 
         FROM reviews 
         WHERE product_id = p.id), 0
      ) as avg_rating,
      COALESCE(
        (SELECT COUNT(*) 
         FROM reviews 
         WHERE product_id = p.id), 0
      ) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
    `;
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND c.name = $${paramCount}`;
      params.push(category);
    }

    if (minPrice) {
      paramCount++;
      query += ` AND p.price >= $${paramCount}`;
      params.push(minPrice);
    }

    if (maxPrice) {
      paramCount++;
      query += ` AND p.price <= $${paramCount}`;
      params.push(maxPrice);
    }

    if (brand) {
      paramCount++;
      query += ` AND p.brand = $${paramCount}`;
      params.push(brand);
    }

    if (search) {
      paramCount++;
      query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Count total products
    const countQuery = `SELECT COUNT(*) FROM (${query}) as total`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Add sorting and pagination
    query += ` ORDER BY p.${sortBy} ${order}`;
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limit);
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push((page - 1) * limit);

    const result = await db.query(query, params);
    const products = result.rows;

    res.json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const productResult = await db.query(
      `SELECT p.*, c.name as category_name, 
       COALESCE(p.images[1], 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853') as primary_image,
       COALESCE(
         (SELECT ROUND(AVG(rating), 1) 
          FROM reviews 
          WHERE product_id = p.id), 0
       ) as avg_rating,
       COALESCE(
         (SELECT COUNT(*) 
          FROM reviews 
          WHERE product_id = p.id), 0
       ) as review_count
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1 AND p.is_active = true`,
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = productResult.rows[0];

    // Get reviews for this product
    const reviewsResult = await db.query(
      `SELECT r.*, u.first_name, u.last_name 
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );

    // Get related products
    const relatedResult = await db.query(
      `SELECT p.*, c.name as category_name,
       COALESCE(p.images[1], 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853') as primary_image
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.category_id = $1 
         AND p.id != $2 
         AND p.is_active = true
       LIMIT 4`,
      [product.category_id, id]
    );

    res.json({
      success: true,
      product: {
        ...product,
        reviews: reviewsResult.rows,
        relatedProducts: relatedResult.rows,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, c.name as category_name,
       COALESCE(p.images[1], 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853') as primary_image
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_featured = true AND p.is_active = true
       LIMIT 8`
    );

    res.json({
      success: true,
      products: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM categories ORDER BY name'
    );

    res.json({
      success: true,
      categories: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Check if product exists
    const productResult = await db.query(
      'SELECT id FROM products WHERE id = $1 AND is_active = true',
      [id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed
    const existingReview = await db.query(
      'SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Add review
    const result = await db.query(
      `INSERT INTO reviews (product_id, user_id, rating, comment) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [id, userId, rating, comment]
    );

    res.status(201).json({
      success: true,
      review: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getFeaturedProducts,
  getCategories,
  addReview,
};