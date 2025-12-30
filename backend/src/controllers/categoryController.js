const db = require('../config/database');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const result = await db.query(
      `WITH RECURSIVE category_tree AS (
        SELECT id, name, slug, description, image_url, parent_id, 1 as level
        FROM categories
        WHERE parent_id IS NULL
        UNION ALL
        SELECT c.id, c.name, c.slug, c.description, c.image_url, c.parent_id, ct.level + 1
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
      )
      SELECT * FROM category_tree ORDER BY level, name`
    );
    
    // Organize categories hierarchically
    const categories = [];
    const categoryMap = {};
    
    result.rows.forEach(category => {
      category.children = [];
      categoryMap[category.id] = category;
      
      if (category.parent_id === null) {
        categories.push(category);
      } else if (categoryMap[category.parent_id]) {
        categoryMap[category.parent_id].children.push(category);
      }
    });
    
    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get category by slug
// @route   GET /api/categories/:slug
// @access  Public
const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const result = await db.query(
      `SELECT c.*, 
              COUNT(DISTINCT p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
       WHERE c.slug = $1
       GROUP BY c.id`,
      [slug]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const category = result.rows[0];
    
    // Get subcategories
    const subcategoriesResult = await db.query(
      'SELECT * FROM categories WHERE parent_id = $1 ORDER BY name',
      [category.id]
    );
    
    // Get featured products in this category
    const productsResult = await db.query(
      `SELECT p.*, 
              COALESCE(AVG(r.rating), 0) as average_rating,
              COUNT(r.id) as review_count
       FROM products p
       LEFT JOIN reviews r ON p.id = r.product_id
       WHERE p.category_id = $1 AND p.is_active = true
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT 8`,
      [category.id]
    );
    
    res.json({
      success: true,
      category: {
        ...category,
        subcategories: subcategoriesResult.rows,
        featured_products: productsResult.rows,
      },
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name, description, parent_id, image_url } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Check if slug already exists
    const existingCategory = await db.query(
      'SELECT id FROM categories WHERE slug = $1',
      [slug]
    );
    
    if (existingCategory.rows.length > 0) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }
    
    const result = await db.query(
      `INSERT INTO categories (name, slug, description, parent_id, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, slug, description, parent_id, image_url]
    );
    
    res.status(201).json({
      success: true,
      category: result.rows[0],
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, description, parent_id, image_url } = req.body;
    
    // Check if category exists
    const categoryResult = await db.query(
      'SELECT * FROM categories WHERE id = $1',
      [categoryId]
    );
    
    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Prevent circular reference (category cannot be its own parent)
    if (parent_id === categoryId) {
      return res.status(400).json({ message: 'Category cannot be its own parent' });
    }
    
    // Generate new slug if name changed
    let slug = categoryResult.rows[0].slug;
    if (name && name !== categoryResult.rows[0].name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      // Check if new slug exists
      const existingCategory = await db.query(
        'SELECT id FROM categories WHERE slug = $1 AND id != $2',
        [slug, categoryId]
      );
      
      if (existingCategory.rows.length > 0) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
    }
    
    const result = await db.query(
      `UPDATE categories 
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           parent_id = COALESCE($4, parent_id),
           image_url = COALESCE($5, image_url)
       WHERE id = $6
       RETURNING *`,
      [name, slug, description, parent_id, image_url, categoryId]
    );
    
    res.json({
      success: true,
      category: result.rows[0],
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Check if category exists
    const categoryResult = await db.query(
      'SELECT * FROM categories WHERE id = $1',
      [categoryId]
    );
    
    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if category has subcategories
    const subcategoriesResult = await db.query(
      'SELECT id FROM categories WHERE parent_id = $1',
      [categoryId]
    );
    
    if (subcategoriesResult.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with subcategories. Delete subcategories first.' 
      });
    }
    
    // Check if category has products
    const productsResult = await db.query(
      'SELECT id FROM products WHERE category_id = $1 LIMIT 1',
      [categoryId]
    );
    
    if (productsResult.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with products. Reassign products first.' 
      });
    }
    
    await db.query('DELETE FROM categories WHERE id = $1', [categoryId]);
    
    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};