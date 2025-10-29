const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { pool, initializeDatabase } = require('./db');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database on startup
initializeDatabase().catch(console.error);

// ==================== GARMENT ROUTES ====================

// Get all garments
app.get('/api/garments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*, 
        json_agg(DISTINCT jsonb_build_object('id', c.id, 'name', c.name, 'hex_code', c.hex_code)) as colors,
        json_agg(DISTINCT jsonb_build_object('id', s.id, 'size', s.size)) as sizes,
        json_agg(DISTINCT jsonb_build_object('id', d.id, 'name', d.name, 'image_url', d.image_url, 'thumbnail_url', d.thumbnail_url, 'price_modifier', d.price_modifier)) as designs
      FROM garments g
      LEFT JOIN colors c ON g.id = c.garment_id
      LEFT JOIN sizes s ON g.id = s.garment_id
      LEFT JOIN garment_designs gd ON g.id = gd.garment_id
      LEFT JOIN designs d ON gd.design_id = d.id
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching garments:', error);
    res.status(500).json({ error: 'Failed to fetch garments' });
  }
});

// Get single garment with all details
app.get('/api/garments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT g.*, 
        json_agg(DISTINCT jsonb_build_object('id', c.id, 'name', c.name, 'hex_code', c.hex_code)) as colors,
        json_agg(DISTINCT jsonb_build_object('id', s.id, 'size', s.size)) as sizes,
        json_agg(DISTINCT jsonb_build_object('id', d.id, 'name', d.name, 'image_url', d.image_url, 'thumbnail_url', d.thumbnail_url, 'price_modifier', d.price_modifier, 'order', gd.display_order)) as designs
      FROM garments g
      LEFT JOIN colors c ON g.id = c.garment_id
      LEFT JOIN sizes s ON g.id = s.garment_id
      LEFT JOIN garment_designs gd ON g.id = gd.garment_id
      LEFT JOIN designs d ON gd.design_id = d.id
      WHERE g.id = $1
      GROUP BY g.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Garment not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching garment:', error);
    res.status(500).json({ error: 'Failed to fetch garment' });
  }
});

// Create garment
app.post('/api/garments', async (req, res) => {
  try {
    const { name, sku, base_price, description } = req.body;

    if (!name || !sku || !base_price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO garments (name, sku, base_price, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, sku, base_price, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating garment:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: 'Failed to create garment' });
  }
});

// Update garment
app.put('/api/garments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, base_price, description } = req.body;

    const result = await pool.query(
      'UPDATE garments SET name = $1, sku = $2, base_price = $3, description = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, sku, base_price, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Garment not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating garment:', error);
    res.status(500).json({ error: 'Failed to update garment' });
  }
});

// Delete garment
app.delete('/api/garments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM garments WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Garment not found' });
    }
    res.json({ message: 'Garment deleted successfully' });
  } catch (error) {
    console.error('Error deleting garment:', error);
    res.status(500).json({ error: 'Failed to delete garment' });
  }
});

// ==================== COLOR ROUTES ====================

// Add color to garment
app.post('/api/garments/:garment_id/colors', async (req, res) => {
  try {
    const { garment_id } = req.params;
    const { name, hex_code } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Color name is required' });
    }

    const result = await pool.query(
      'INSERT INTO colors (garment_id, name, hex_code) VALUES ($1, $2, $3) RETURNING *',
      [garment_id, name, hex_code]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding color:', error);
    res.status(500).json({ error: 'Failed to add color' });
  }
});

// Delete color
app.delete('/api/colors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM colors WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Color not found' });
    }
    res.json({ message: 'Color deleted successfully' });
  } catch (error) {
    console.error('Error deleting color:', error);
    res.status(500).json({ error: 'Failed to delete color' });
  }
});

// ==================== SIZE ROUTES ====================

// Add size to garment
app.post('/api/garments/:garment_id/sizes', async (req, res) => {
  try {
    const { garment_id } = req.params;
    const { size } = req.body;

    if (!size) {
      return res.status(400).json({ error: 'Size is required' });
    }

    const result = await pool.query(
      'INSERT INTO sizes (garment_id, size) VALUES ($1, $2) RETURNING *',
      [garment_id, size]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding size:', error);
    res.status(500).json({ error: 'Failed to add size' });
  }
});

// Delete size
app.delete('/api/sizes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM sizes WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Size not found' });
    }
    res.json({ message: 'Size deleted successfully' });
  } catch (error) {
    console.error('Error deleting size:', error);
    res.status(500).json({ error: 'Failed to delete size' });
  }
});

// ==================== DESIGN ROUTES ====================

// Get all designs
app.get('/api/designs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM designs WHERE is_active = TRUE ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
});

// Create design
app.post('/api/designs', async (req, res) => {
  try {
    const { name, image_url, thumbnail_url, price_modifier } = req.body;

    if (!name || !image_url) {
      return res.status(400).json({ error: 'Name and image_url are required' });
    }

    const result = await pool.query(
      'INSERT INTO designs (name, image_url, thumbnail_url, price_modifier) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, image_url, thumbnail_url || image_url, price_modifier || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating design:', error);
    res.status(500).json({ error: 'Failed to create design' });
  }
});

// Update design
app.put('/api/designs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image_url, thumbnail_url, price_modifier, is_active } = req.body;

    const result = await pool.query(
      'UPDATE designs SET name = $1, image_url = $2, thumbnail_url = $3, price_modifier = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, image_url, thumbnail_url, price_modifier, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Design not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating design:', error);
    res.status(500).json({ error: 'Failed to update design' });
  }
});

// Delete design
app.delete('/api/designs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM designs WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Design not found' });
    }
    res.json({ message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Error deleting design:', error);
    res.status(500).json({ error: 'Failed to delete design' });
  }
});

// Associate design with garment
app.post('/api/garments/:garment_id/designs/:design_id', async (req, res) => {
  try {
    const { garment_id, design_id } = req.params;
    const { display_order } = req.body;

    const result = await pool.query(
      'INSERT INTO garment_designs (garment_id, design_id, display_order) VALUES ($1, $2, $3) RETURNING *',
      [garment_id, design_id, display_order || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error associating design:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Design already associated with this garment' });
    }
    res.status(500).json({ error: 'Failed to associate design' });
  }
});

// Remove design from garment
app.delete('/api/garments/:garment_id/designs/:design_id', async (req, res) => {
  try {
    const { garment_id, design_id } = req.params;
    const result = await pool.query(
      'DELETE FROM garment_designs WHERE garment_id = $1 AND design_id = $2 RETURNING *',
      [garment_id, design_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Association not found' });
    }
    res.json({ message: 'Design removed from garment' });
  } catch (error) {
    console.error('Error removing design:', error);
    res.status(500).json({ error: 'Failed to remove design' });
  }
});

// ==================== CUSTOMIZATION/CART ROUTES ====================

// Save customization to cart (creates entry for tracking)
app.post('/api/customizations', async (req, res) => {
  try {
    const { garment_id, design_id, selected_color_id, selected_size_id, total_price, customization_data } = req.body;

    const customizationId = uuidv4();

    const result = await pool.query(
      `INSERT INTO customizations 
       (id, garment_id, design_id, selected_color_id, selected_size_id, total_price, customization_data) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [customizationId, garment_id, design_id, selected_color_id, selected_size_id, total_price, JSON.stringify(customization_data)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving customization:', error);
    res.status(500).json({ error: 'Failed to save customization' });
  }
});

// Get customization details
app.get('/api/customizations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT c.*, 
        g.name as garment_name, g.sku as garment_sku, g.base_price,
        d.name as design_name, d.thumbnail_url,
        col.name as color_name,
        s.size as size_name
      FROM customizations c
      LEFT JOIN garments g ON c.garment_id = g.id
      LEFT JOIN designs d ON c.design_id = d.id
      LEFT JOIN colors col ON c.selected_color_id = col.id
      LEFT JOIN sizes s ON c.selected_size_id = s.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customization not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching customization:', error);
    res.status(500).json({ error: 'Failed to fetch customization' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
