const { Pool, types } = require('pg');
require('dotenv').config();

// Ensure TIMESTAMP (1114) and TIMESTAMPTZ (1184) are parsed as UTC ISO 8601 strings
// This prevents node-pg from erroneously interpreting database UTC timestamps as local server time
types.setTypeParser(1114, (stringValue) => {
  if (!stringValue) return null;
  const cleanStr = stringValue.replace(' ', 'T');
  return cleanStr.endsWith('Z') ? cleanStr : cleanStr + 'Z';
});

types.setTypeParser(1184, (stringValue) => {
  if (!stringValue) return null;
  return new Date(stringValue).toISOString();
});

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl: process.env.PG_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
