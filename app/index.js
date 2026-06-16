const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres-service',
  port: 5432,
  database: process.env.DB_NAME || 'appdb',
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASSWORD || 'apppassword',
  connectionTimeoutMillis: 3000,
});

// Health endpoints
app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ready', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', db: err.message });
  }
});

// Main API
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time, version() as version');
    res.json({ message: 'Hello from DevOps Challenge!', db: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/visits', async (req, res) => {
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS visits (id SERIAL, ts TIMESTAMP DEFAULT NOW())');
    await pool.query('INSERT INTO visits(ts) VALUES(NOW())');
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM visits');
    res.json({ visits: rows[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
