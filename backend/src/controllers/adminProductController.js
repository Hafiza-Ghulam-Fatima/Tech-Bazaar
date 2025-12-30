const db = require('../config/database');

// @desc    Get all products for admin
// @route   GET /api/admin/products
// @access  Private/Admin
exports.getProducts = async (req, res) => {
  try {
    console.log('Fetching products for admin...');
    
    const result = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = true
       ORDER BY p.created_at DESC`
    );

    res.json({
      success: true,
      products: result.rows
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching products'
    });
  }
};

// @desc    Get product by ID for admin
// @route   GET /api/admin/products/:id
// @access  Private/Admin
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1 AND p.is_active = true`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create product (admin)
// @route   POST /api/admin/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    console.log('Creating product with data:', req.body);
    
    const { 
      name, 
      description, 
      price, 
      category_id, 
      stock,
      images = [],
      brand,
      discount_percent = 0,
      is_featured = false
    } = req.body;

    // Validation
    if (!name || !description || !price || !category_id) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, description, price, and category are required',
        received: req.body
      });
    }

    // Check if category exists
    const categoryCheck = await db.query(
      'SELECT id FROM categories WHERE id = $1',
      [category_id]
    );
    
    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid category ID'
      });
    }

    // Parse images if string
    let formattedImages = images;
    if (typeof images === 'string') {
      // Clean the string by removing any JSON formatting
      const cleanString = images.replace(/[\[\]\"\{\}]/g, '');
      formattedImages = cleanString.split(',').map(url => url.trim()).filter(url => url);
    }

    // Ensure at least one image
    if (!Array.isArray(formattedImages) || formattedImages.length === 0) {
      formattedImages = ['https://via.placeholder.com/500'];
    }

    console.log('Formatted images for create:', formattedImages);

    // Insert product
    const result = await db.query(
      `INSERT INTO products (
        name, description, price, category_id, brand, 
        stock_quantity, images, discount_percent, is_featured, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        name.trim(),
        description.trim(),
        parseFloat(price),
        parseInt(category_id),
        brand?.trim() || null,
        parseInt(stock) || 0,
        formattedImages, // Already an array
        parseFloat(discount_percent) || 0,
        Boolean(is_featured),
        true
      ]
    );

    console.log('Product created successfully');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Create product error details:', error);
    
    // Check for specific database errors
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ 
        success: false,
        message: 'Invalid category ID'
      });
    }
    
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ 
        success: false,
        message: 'Product with similar name already exists'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error creating product',
      error: error.message
    });
  }
};

// @desc    Update product (admin)
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log(`Updating product ${id} with data:`, updates);

    // Check if product exists
    const productCheck = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    const currentProduct = productCheck.rows[0];

    // Handle category validation
    if (updates.category_id) {
      const categoryCheck = await db.query(
        'SELECT id FROM categories WHERE id = $1',
        [updates.category_id]
      );
      
      if (categoryCheck.rows.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid category ID'
        });
      }
    }

    // Handle images - FIXED: Properly format for PostgreSQL array
    let formattedImages = currentProduct.images || [];
    if (updates.images !== undefined) {
      if (typeof updates.images === 'string') {
        // Remove any existing JSON formatting
        const cleanString = updates.images.replace(/[\[\]\"\{\}]/g, '');
        formattedImages = cleanString.split(',').map(url => url.trim()).filter(url => url);
      } else if (Array.isArray(updates.images)) {
        formattedImages = updates.images;
      }
      
      if (!Array.isArray(formattedImages) || formattedImages.length === 0) {
        formattedImages = ['https://via.placeholder.com/500'];
      }
    }

    console.log('Formatted images for update:', formattedImages);

    // Build update query with proper parameter handling
    const result = await db.query(
      `UPDATE products 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           category_id = COALESCE($4, category_id),
           stock_quantity = COALESCE($5, stock_quantity),
           images = COALESCE($6, images),
           brand = COALESCE($7, brand),
           discount_percent = COALESCE($8, discount_percent),
           is_featured = COALESCE($9, is_featured),
           is_active = COALESCE($10, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        updates.name?.trim() || null,
        updates.description?.trim() || null,
        updates.price !== undefined ? parseFloat(updates.price) : null,
        updates.category_id !== undefined ? parseInt(updates.category_id) : null,
        updates.stock !== undefined ? parseInt(updates.stock) : null,
        formattedImages, // Already an array, PostgreSQL will handle it
        updates.brand?.trim() || null,
        updates.discount_percent !== undefined ? parseFloat(updates.discount_percent) : null,
        updates.is_featured !== undefined ? Boolean(updates.is_featured) : null,
        updates.is_active !== undefined ? Boolean(updates.is_active) : null,
        id
      ]
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Update product error details:', error);
    
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ 
        success: false,
        message: 'Invalid category ID'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error updating product',
      error: error.message
    });
  }
};

// @desc    Delete product (admin)
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Soft deleting product ${id}`);

    // Check if product exists
    const productCheck = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    // Soft delete (set is_active to false)
    const result = await db.query(
      `UPDATE products 
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    res.json({
      success: true,
      message: 'Product deleted successfully',
      productId: result.rows[0].id
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error deleting product'
    });
  }
};