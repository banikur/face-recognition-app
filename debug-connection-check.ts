
import { getPgPool } from './src/lib/db-pg-supabase-adapter';

async function testConnection() {
    console.log('Testing connection to DB (Hardcoded URL fallback)...');
    try {
        const pool = getPgPool();
        const client = await pool.connect();
        console.log('Connected successfully!');
        const res = await client.query('SELECT NOW() as current_time');
        console.log('Query Result:', res.rows[0]);

        // Test simple table query if possible
        try {
            const res2 = await client.query('SELECT count(*) FROM products');
            console.log('Product Count:', res2.rows[0]);
        } catch (e) {
            console.log('Could not count products (table might not exist yet):', e.message);
        }

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Connection Failed:', err);
        process.exit(1);
    }
}

testConnection();
