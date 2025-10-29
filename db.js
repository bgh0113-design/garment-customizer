const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initializeDatabase = async () => {
  try {
    console.log('Initializing database schema...');

    // Create Garments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS garments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) UNIQUE NOT NULL,
        base_price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Colors table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS colors (
        id SERIAL PRIMARY KEY,
        garment_id INTEGER NOT NULL REFERENCES garments(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        hex_code VARCHAR(7),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Sizes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sizes (
        id SERIAL PRIMARY KEY,
        garment_id INTEGER NOT NULL REFERENCES garments(id) ON DELETE CASCADE,
        size VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Designs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS designs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image_url TEXT NOT NULL,
        thumbnail_url TEXT,
        price_modifier DECIMAL(10, 2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create GarmentDesigns junction table (many-to-many relationship)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS garment_designs (
        id SERIAL PRIMARY KEY,
        garment_id INTEGER NOT NULL REFERENCES garments(id) ON DELETE CASCADE,
        design_id INTEGER NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
        display_order INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(garment_id, design_id)
      );
    `);

    // Create Orders/Customizations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customizations (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(255),
        line_item_id VARCHAR(255),
        garment_id INTEGER NOT NULL REFERENCES garments(id),
        design_id INTEGER REFERENCES designs(id),
        selected_color_id INTEGER REFERENCES colors(id),
        selected_size_id INTEGER REFERENCES sizes(id),
        customization_data JSONB,
        total_price DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database schema initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = {
  pool,
  initializeDatabase,
};
