const db = require('../config/database');

// @desc    Get all categories for admin
// @route   GET /api/admin/categories
// @access  Private/Admin
exports.getCategories = async (req, res) => {
  try {
    console.log('Getting categories for admin...');
    
    const result = await db.query(
      `SELECT c.*, 
              COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
       GROUP BY c.id
       ORDER BY c.name`
    );

    res.json({
      success: true,
      categories: result.rows
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error getting categories' 
    });
  }
};

// @desc    Get category by ID for admin
// @route   GET /api/admin/categories/:id
// @access  Private/Admin
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Category not found' 
      });
    }

    // Get product count
    const productCountResult = await db.query(
      'SELECT COUNT(*) FROM products WHERE category_id = $1 AND is_active = true',
      [id]
    );

    const category = result.rows[0];
    category.product_count = parseInt(productCountResult.rows[0].count);

    res.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// @desc    Create category (admin)
// @route   POST /api/admin/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    console.log('Creating category with data:', req.body);
    
    const { name, description, parent_id, image_url } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Category name is required' 
      });
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Check if slug already exists
    const existingCheck = await db.query(
      'SELECT id FROM categories WHERE slug = $1',
      [slug]
    );
    
    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Category with this name already exists' 
      });
    }

    // Insert category
    const result = await db.query(
      `INSERT INTO categories (name, slug, description, parent_id, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        name.trim(),
        slug,
        description?.trim() || null,
        parent_id || null,
        image_url?.trim() || null
      ]
    );

    console.log('Category created successfully');

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Create category error details:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ 
        success: false,
        message: 'Category with this name already exists'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error creating category',
      error: error.message
    });
  }
};

// @desc    Update category (admin)
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id, image_url } = req.body;

    console.log(`Updating category ${id} with data:`, req.body);

    // Check if category exists
    const categoryCheck = await db.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );
    
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Category not found' 
      });
    }

    const currentCategory = categoryCheck.rows[0];

    // Generate slug if name changed
    let slug = currentCategory.slug;
    if (name && name !== currentCategory.name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      // Check if new slug exists (excluding current category)
      const existingCheck = await db.query(
        'SELECT id FROM categories WHERE slug = $1 AND id != $2',
        [slug, id]
      );
      
      if (existingCheck.rows.length > 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Category with this name already exists' 
        });
      }
    }

    // Prevent circular reference
    if (parent_id && parent_id == id) {
      return res.status(400).json({ 
        success: false,
        message: 'Category cannot be its own parent' 
      });
    }

    // Build update query - REMOVED updated_at since column doesn't exist
    const result = await db.query(
      `UPDATE categories 
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           parent_id = COALESCE($4, parent_id),
           image_url = COALESCE($5, image_url)
       WHERE id = $6
       RETURNING *`,
      [
        name?.trim() || currentCategory.name,
        slug,
        description?.trim() || currentCategory.description,
        parent_id !== undefined ? parent_id : currentCategory.parent_id,
        image_url?.trim() || currentCategory.image_url,
        id
      ]
    );

    res.json({
      success: true,
      message: 'Category updated successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Update category error details:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ 
        success: false,
        message: 'Category with this name already exists'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error updating category',
      error: error.message
    });
  }
};

// @desc    Delete category (admin)
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Attempting to delete category ${id}`);

    // Check if category exists
    const categoryCheck = await db.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );
    
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Category not found' 
      });
    }

    // Get product count for this category
    const productCountResult = await db.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1 AND is_active = true',
      [id]
    );
    
    const productCount = parseInt(productCountResult.rows[0].count);
    console.log(`Product count for category ${id}: ${productCount}`);
    
    if (productCount > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Cannot delete category with ${productCount} active product(s). Please reassign or delete products first.` 
      });
    }

    // Check if category has subcategories
    const subcategoriesCheck = await db.query(
      'SELECT id FROM categories WHERE parent_id = $1',
      [id]
    );
    
    if (subcategoriesCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete category with subcategories. Please delete subcategories first.' 
      });
    }

    // Delete category
    const deleteResult = await db.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id, name',
      [id]
    );

    console.log('Category deleted successfully:', deleteResult.rows[0]);

    res.json({
      success: true,
      message: 'Category deleted successfully',
      deletedCategory: deleteResult.rows[0]
    });
  } catch (error) {
    console.error('Delete category error:', error);
    
    // Handle foreign key constraint errors
    if (error.code === '23503') {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete category because it is referenced by other records (products or subcategories).'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error deleting category',
      error: error.message
    });
  }
};