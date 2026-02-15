/**
 * Setup database deploy: jalankan migrasi + seeder ke PostgreSQL.
 * Pakai env: DATABASE_URL atau DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.
 * Di Vercel: set env di Project Settings → Environment Variables.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';
import { Pool } from 'pg';
import { getDatabaseUrl } from '../config/deploy-db';

config({ path: resolve(process.cwd(), '.env.local') });

console.log('🔧 [setup:deploy] Memeriksa env...');
const connectionString = getDatabaseUrl();
if (!connectionString) {
  console.log('⚠️ [setup:deploy] DATABASE_URL/DB_* tidak diset. Lewati migrasi (jalankan data/full-setup.sql manual).');
  process.exit(0);
}

console.log('🔧 [setup:deploy] Menghubungkan DB & menjalankan migrasi + seed...');
process.env.DATABASE_URL = connectionString;
const pool = new Pool({ connectionString });

async function runMigration() {
  console.log('📦 Menjalankan migrasi...');
  const sqlPath = resolve(process.cwd(), 'data', 'supabase-migration.sql');
  const sql = readFileSync(sqlPath, 'utf-8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('✅ Migrasi selesai.');
  } finally {
    client.release();
  }
}

async function runSeed() {
  console.log('🌱 Menjalankan seeder...');
  const client = await pool.connect();

  try {
    const countRec = await client.query('SELECT COUNT(*) AS c FROM recommendations');
    if (Number(countRec.rows[0]?.c) > 0) {
      console.log('   Data sudah ada, seeder dilewati.');
      return;
    }

    // 1. Recommendations (skin types)
    const skinTypes = [
      { name: 'Oily', description: 'Skin that produces excess sebum' },
      { name: 'Dry', description: 'Skin that lacks moisture and oil' },
      { name: 'Normal', description: 'Balanced skin with adequate moisture and oil' },
      { name: 'Combination', description: 'Skin with both oily and dry areas' },
      { name: 'Acne-prone', description: 'Skin that is susceptible to breakouts and pimples' },
    ];
    const skinTypeIds: number[] = [];
    for (const st of skinTypes) {
      const r = await client.query(
        `INSERT INTO recommendations (condition, title, description, tips) VALUES ($1, $2, $3, NULL) RETURNING id`,
        [st.name, st.name, st.description]
      );
      skinTypeIds.push(r.rows[0].id);
    }
    console.log('   Inserted skin types (recommendations):', skinTypeIds.length);

    // 2. Ingredients
    const ingredients = [
      { name: 'Salicylic Acid', effect: 'Exfoliates and unclogs pores' },
      { name: 'Tea Tree Oil', effect: 'Natural antibacterial agent' },
      { name: 'Hyaluronic Acid', effect: 'Intense hydration' },
      { name: 'Glycerin', effect: 'Moisture retention' },
      { name: 'Aloe Vera', effect: 'Soothing and calming' },
      { name: 'Chamomile', effect: 'Anti-inflammatory properties' },
      { name: 'Niacinamide', effect: 'Reduces sebum production' },
      { name: 'Ceramides', effect: 'Strengthens skin barrier' },
      { name: 'Benzoyl Peroxide', effect: 'Kills acne-causing bacteria' },
    ];
    for (const ing of ingredients) {
      await client.query(
        `INSERT INTO ingredients (name, effect, w_oily, w_dry, w_normal, w_acne) VALUES ($1, $2, 0, 0, 0, 0)`,
        [ing.name, ing.effect]
      );
    }
    console.log('   Inserted ingredients:', ingredients.length);

    // 3. Products
    const products = [
      { name: 'Oil Control Face Wash', description: 'Controls excess oil and prevents breakouts' },
      { name: 'Hydrating Face Wash', description: 'Gentle cleanser that hydrates while cleaning' },
      { name: 'Balancing Face Wash', description: "Maintains skin's natural balance" },
      { name: 'Dual Action Cleanser', description: 'Targets both oily and dry areas' },
      { name: 'Anti-Acne Face Wash', description: 'Treats and prevents acne breakouts' },
    ];
    const productIds: number[] = [];
    for (const p of products) {
      const r = await client.query(
        `INSERT INTO products (name, brand_id, category_id, description, image_url, w_oily, w_dry, w_normal, w_acne) 
         VALUES ($1, NULL, NULL, $2, NULL, 0, 0, 0, 0) RETURNING id`,
        [p.name, p.description]
      );
      productIds.push(r.rows[0].id);
    }
    console.log('   Inserted products:', productIds.length);

    // 4. Rules
    const rules = [
      { skin_type_id: skinTypeIds[0], product_id: productIds[0], confidence_score: 0.95 },
      { skin_type_id: skinTypeIds[1], product_id: productIds[1], confidence_score: 0.95 },
      { skin_type_id: skinTypeIds[2], product_id: productIds[2], confidence_score: 0.95 },
      { skin_type_id: skinTypeIds[3], product_id: productIds[3], confidence_score: 0.9 },
      { skin_type_id: skinTypeIds[4], product_id: productIds[4], confidence_score: 0.95 },
    ];
    for (const rule of rules) {
      await client.query(
        `INSERT INTO rules (skin_type_id, product_id, confidence_score) VALUES ($1, $2, $3)`,
        [rule.skin_type_id, rule.product_id, rule.confidence_score]
      );
    }
    console.log('   Inserted rules:', rules.length);

    // 5. Sample analysis logs
    const logs = [
      { user_name: 'Sample User 1', user_age: 25, oily_score: 0.8, dry_score: 0.2, normal_score: 0.1, acne_score: 0.3, dominant_condition: 'Oily', recommended_product_ids: String(productIds[0]) },
      { user_name: 'Sample User 2', user_age: 30, oily_score: 0.1, dry_score: 0.9, normal_score: 0.2, acne_score: 0.1, dominant_condition: 'Dry', recommended_product_ids: String(productIds[1]) },
      { user_name: 'Sample User 3', user_age: 28, oily_score: 0.3, dry_score: 0.3, normal_score: 0.7, acne_score: 0.2, dominant_condition: 'Normal', recommended_product_ids: String(productIds[2]) },
      { user_name: 'Sample User 4', user_age: 32, oily_score: 0.5, dry_score: 0.4, normal_score: 0.3, acne_score: 0.2, dominant_condition: 'Combination', recommended_product_ids: String(productIds[3]) },
      { user_name: 'Sample User 5', user_age: 22, oily_score: 0.6, dry_score: 0.2, normal_score: 0.1, acne_score: 0.8, dominant_condition: 'Acne-prone', recommended_product_ids: String(productIds[4]) },
    ];
    for (const log of logs) {
      await client.query(
        `INSERT INTO analysis_logs (user_name, user_email, user_phone, user_age, oily_score, dry_score, normal_score, acne_score, dominant_condition, recommended_product_ids)
         VALUES ($1, NULL, NULL, $2, $3, $4, $5, $6, $7, $8)`,
        [log.user_name, log.user_age, log.oily_score, log.dry_score, log.normal_score, log.acne_score, log.dominant_condition, log.recommended_product_ids]
      );
    }
    console.log('   Inserted analysis logs:', logs.length);

    console.log('✅ Seeder selesai.');
  } finally {
    client.release();
  }
}

async function runSeedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@skinlab.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  console.log('👤 Membuat akun admin...');
  const bcrypt = await import('bcryptjs');
  const client = await pool.connect();
  try {
    const hash = await bcrypt.hash(adminPassword, 10);
    await client.query(
      `INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [adminEmail.toLowerCase(), hash]
    );
    console.log('   Admin dibuat:', adminEmail);
  } catch (err) {
    console.warn('   ⚠️ Admin gagal:', err);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await runMigration();
    await runSeed();
    await runSeedAdmin();
    console.log('✅ [setup:deploy] Migrasi + seed selesai.');
  } catch (err) {
    console.error('⚠️ [setup:deploy] Gagal (DB unreachable?):', err instanceof Error ? err.message : err);
    console.log('   Jalankan data/full-setup.sql manual di DB, lalu redeploy.');
  } finally {
    await pool.end();
  }
}

main();
