/**
 * PostgreSQL Adapter (pg) compatible with Supabase API.
 * Uses DATABASE_URL for connection.
 */

import { Pool } from 'pg';

let pool: Pool | null = null;
const HARDCODED_DB_URL = 'postgresql://creativo:Admin1234%25@115.124.72.218:9999/ai_testing_db';

export function getPgPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL || HARDCODED_DB_URL;
    if (!url) throw new Error('DATABASE_URL is required for pg adapter');
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

type QueryResult = { data: unknown; error: Error | null };

interface Chain {
  then(onFulfilled?: (value: QueryResult) => unknown, onRejected?: (reason: unknown) => unknown): Promise<QueryResult>;
  catch(onRejected?: (reason: unknown) => unknown): Promise<QueryResult>;
}

function buildChain(pool: Pool, table: string): {
  _table: string;
  _select: string | null;
  _where: { col: string; op: string; val: unknown }[];
  _orderBy: { col: string; asc: boolean } | null;
  _limit: number | null;
  _single: boolean;
  _insert: Record<string, unknown> | null;
  _update: Record<string, unknown> | null;
  _delete: boolean;
  _pool: Pool;
} {
  return {
    _table: table,
    _select: null,
    _where: [],
    _orderBy: null,
    _limit: null,
    _single: false,
    _insert: null,
    _update: null,
    _delete: false,
    _pool: pool,
  };
}

function hasSelectJoin(select: string): boolean {
  return select.includes('brands:') || select.includes('product_categories:') || select.includes('ingredients:');
}

async function executeChain(state: ReturnType<typeof buildChain>): Promise<QueryResult> {
  const { _table, _select, _single, _insert, _update, _delete, _pool } = state;
  const client = await _pool.connect();
  try {
    // Helper to determine RETURNING clause
    const returning = _select
      ? (_select === '*' ? ' RETURNING *' : ` RETURNING ${_select}`)
      : '';

    if (_insert) {
      const cols = Object.keys(_insert).filter((k) => _insert[k] !== undefined);
      const vals = cols.map((k) => _insert[k]);
      const placeholders = cols.map((_, i) => `$${i + 1}`);
      const quotedCols = cols.map((c) => `"${c}"`).join(', ');

      const q = `INSERT INTO ${_table} (${quotedCols}) VALUES (${placeholders.join(', ')})${returning}`;
      const r = await client.query(q, vals);
      return { data: _single ? r.rows[0] : r.rows, error: null };
    }
    if (_update) {
      const cols = Object.keys(_update).filter((k) => _update[k] !== undefined);
      if (cols.length === 0) return { data: null, error: null };
      const setClause = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
      const vals = cols.map((c) => _update[c]);
      const whereStart = vals.length + 1;
      const whereClause = state._where.map((w, i) => `"${w.col}" ${w.op} $${whereStart + i}`).join(' AND ');
      const allVals = [...vals, ...state._where.map((w) => w.val)];

      const q = `UPDATE ${_table} SET ${setClause} WHERE ${whereClause}${returning}`;
      const r = await client.query(q, allVals);
      // Logic for returning data if requested
      const data = returning ? (_single ? r.rows[0] : r.rows) : null;
      return { data, error: null };
    }
    if (_delete) {
      const placeholders = state._where.map((_, i) => `$${i + 1}`);
      const whereClause = state._where.map((w) => `"${w.col}" ${w.op} ${placeholders.shift()}`).join(' AND ');
      const q = `DELETE FROM ${_table} WHERE ${whereClause}${returning}`;
      const r = await client.query(q, state._where.map((w) => w.val));
      const data = returning ? (_single ? r.rows[0] : r.rows) : null;
      return { data, error: null };
    }
    // SELECT
    let selectClause = _select || '*';
    let fromClause = _table;
    if (_table === 'products' && hasSelectJoin(selectClause)) {
      fromClause = `products p LEFT JOIN brands b ON p.brand_id = b.id LEFT JOIN product_categories c ON p.category_id = c.id`;
      selectClause = `p.*, b.name AS brand_name, c.name AS category_name`;
    }
    if (_table === 'product_ingredients' && selectClause.includes('ingredients:')) {
      fromClause = `product_ingredients LEFT JOIN ingredients ON product_ingredients.ingredient_id = ingredients.id`;
      selectClause = 'ingredients.*';
    }
    // Rules -> Products -> Brands/Categories Join support
    if (_table === 'rules' && selectClause.includes('products:product_id')) {
      fromClause = `rules r LEFT JOIN products p ON r.product_id = p.id LEFT JOIN brands b ON p.brand_id = b.id LEFT JOIN product_categories c ON p.category_id = c.id`;
      selectClause = `r.confidence_score, p.*, b.name as brand_name, c.name as category_name`;
    }

    const whereClause = state._where.length
      ? ' WHERE ' + state._where.map((w, i) => `"${w.col}" ${w.op} $${i + 1}`).join(' AND ')
      : '';
    // Fix potential ambiguity in ORDER BY when joining
    // If joining products, assume order by is on products table
    let orderTablePrefix = '';
    if (_table === 'products' && hasSelectJoin(selectClause)) orderTablePrefix = 'p.';
    if (_table === 'rules') orderTablePrefix = 'r.';

    const orderClause = state._orderBy
      ? ` ORDER BY ${orderTablePrefix}"${state._orderBy.col}" ${state._orderBy.asc ? 'ASC' : 'DESC'}`
      : '';
    const limitClause = _single ? ' LIMIT 1' : (state._limit ? ` LIMIT ${state._limit}` : '');
    const q = `SELECT ${selectClause} FROM ${fromClause}${whereClause}${orderClause}${limitClause}`;
    const r = await client.query(q, state._where.map((w) => w.val));
    let data = _single ? r.rows[0] ?? null : r.rows;

    if (_table === 'products' && hasSelectJoin(selectClause)) {
      const rows = Array.isArray(data) ? data : data ? [data] : [];
      const mapped = rows.map((row: Record<string, unknown>) => ({
        ...row,
        brands: row.brand_name != null ? { name: row.brand_name } : null,
        product_categories: row.category_name != null ? { name: row.category_name } : null,
      }));
      data = _single ? mapped[0] ?? null : mapped;
    }
    if (_table === 'product_ingredients' && Array.isArray(data)) {
      data = data.map((row: Record<string, unknown>) => ({ ingredients: row }));
    }
    if (_table === 'rules' && selectClause.includes('products:product_id')) {
      const rows = Array.isArray(data) ? data : data ? [data] : [];
      const mapped = rows.map((row: Record<string, unknown>) => {
        const { confidence_score, explanation, ...productData } = row;
        const brands = productData.brand_name != null ? { name: productData.brand_name } : null;
        const product_categories = productData.category_name != null ? { name: productData.category_name } : null;
        return {
          confidence_score,
          explanation,
          products: {
            ...productData,
            brands,
            product_categories
          }
        };
      });
      data = _single ? mapped[0] ?? null : mapped;
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  } finally {
    client.release();
  }
}

function makeChain(state: ReturnType<typeof buildChain>): Chain {
  let promise: Promise<QueryResult> | null = null;
  const getPromise = () => {
    if (!promise) promise = executeChain(state);
    return promise;
  };

  return {
    then(onFulfilled?: (value: QueryResult) => unknown, onRejected?: (reason: unknown) => unknown): Promise<QueryResult> {
      return getPromise().then(onFulfilled, onRejected) as Promise<QueryResult>;
    },
    catch(onRejected?: (reason: unknown) => unknown): Promise<QueryResult> {
      return getPromise().catch(onRejected) as Promise<QueryResult>;
    },
  };
}

function createBuilder(pool: Pool, table: string) {
  const state = buildChain(pool, table);
  const chain = makeChain(state) as Chain & Record<string, unknown>;
  chain.select = (cols?: string) => {
    state._select = cols ?? '*';
    return chain;
  };
  chain.order = (col: string, opts?: { ascending?: boolean }) => {
    state._orderBy = { col, asc: opts?.ascending !== false };
    return chain;
  };
  chain.eq = (col: string, val: unknown) => {
    state._where.push({ col, op: '=', val });
    return chain;
  };
  chain.gte = (col: string, val: unknown) => {
    state._where.push({ col, op: '>=', val });
    return chain;
  };
  chain.lte = (col: string, val: unknown) => {
    state._where.push({ col, op: '<=', val });
    return chain;
  };
  chain.single = () => {
    state._single = true;
    return chain;
  };
  chain.limit = (n: number) => {
    state._limit = n;
    return chain;
  };
  chain.insert = (obj: Record<string, unknown>) => {
    state._insert = obj;
    return chain;
  };
  chain.update = (obj: Record<string, unknown>) => {
    state._update = obj;
    return chain;
  };
  chain.delete = () => {
    state._delete = true;
    return chain;
  };
  return chain;
}

export function createPgSupabaseAdapter(): { from: (table: string) => ReturnType<typeof createBuilder> } {
  const p = getPgPool();
  return {
    from(table: string) {
      return createBuilder(p, table);
    },
  };
}
