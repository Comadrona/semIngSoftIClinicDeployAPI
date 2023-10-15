const Pool = require ("pg").Pool;
const pool = new Pool({
    connectionString: process.env.DATABASE_URI + "?sslmode=require",
});

module.exports = pool;