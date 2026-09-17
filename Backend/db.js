const { Pool, types } = require('pg');
const path = require('path');
const dns = require('dns');

// Prioritize IPv4 addresses over IPv6 to prevent Windows/VPN EACCES socket connection failures
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Ensure .env is always loaded from Backend folder regardless of execution directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

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

const isSslRequired = process.env.PG_SSLMODE === 'require' || (process.env.PG_HOST && process.env.PG_HOST !== 'localhost');

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT || '5432', 10),
  ssl: isSslRequired ? {
    rejectUnauthorized: false,
    servername: process.env.PG_HOST,
  } : false,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
});

pool.on('error', (err, client) => {
  console.warn('⚠️ [Database Pool] Unexpected error on idle client (reconnecting):', err.message || err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};

