const db = require('../config/database');

class Category {
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findBySlug(slug) {
    const result = await db.query(
      'SELECT * FROM categories WHERE slug = $1',
      [slug]
    );
    return result.rows[0];
  }

  static async findAll() {
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
    
    // Organize hierarchically
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
    
    return categories;
  }

  static async create(categoryData) {
    const { name, description, parent_id, image_url } = categoryData;
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const result = await db.query(
      `INSERT INTO categories 
       (name, slug, description, parent_id, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, slug, description, parent_id, image_url]
    );
    
    return result.rows[0];
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && key !== 'slug') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    // Regenerate slug if name is being updated
    const nameIndex = fields.findIndex(field => field.startsWith('name ='));
    if (nameIndex !== -1) {
      const nameValue = values[nameIndex];
      const slug = nameValue.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      fields.push('slug = $' + paramCount);
      values.push(slug);
      paramCount++;
    }

    values.push(id);

    const query = `
      UPDATE categories 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    await db.query('DELETE FROM categories WHERE id = $1', [id]);
  }

  static async getProductCount(id) {
    const result = await db.query(
      'SELECT COUNT(*) FROM products WHERE category_id = $1 AND is_active = true',
      [id]
    );
    return parseInt(result.rows[0].count);
  }

  static async getSubcategories(id) {
    const result = await db.query(
      'SELECT * FROM categories WHERE parent_id = $1 ORDER BY name',
      [id]
    );
    return result.rows;
  }
}

module.exports = Category;