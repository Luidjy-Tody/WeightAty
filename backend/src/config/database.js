"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testDatabaseConnection = testDatabaseConnection;
require("dotenv/config");
const pg_1 = require("pg");
// CONFIGURATION POSTGRESQL
exports.pool = new pg_1.Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});
// TEST DE CONNEXION
async function testDatabaseConnection() {
    const client = await exports.pool.connect();
    try {
        const result = await client.query('SELECT NOW()');
        console.log('PostgreSQL connecté :', result.rows[0].now);
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=database.js.map