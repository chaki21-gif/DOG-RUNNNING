import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });

async function main() {
    const res = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'Product';
    `);
    console.log('Columns in Product table:');
    console.log(JSON.stringify(res.rows, null, 2));
}

main()
    .catch(err => console.error('Error:', err))
    .finally(() => pool.end());
