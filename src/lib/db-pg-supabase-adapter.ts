/**
 * Adapter Supabase-like untuk PostgreSQL (pg).
 * Dipakai ketika DATABASE_URL diset (deploy) agar aplikasi tidak perlu Supabase.
 */

import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPgPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
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
  _select: string;
  _where: { col: string; op: string; val: unknown }[];
  _orderBy: { col: string; asc: boolean } | null;
  _single: boolean;
  _insert: Record<string, unknown> | null;
  _update: Record<string, unknown> | null;
  _delete: boolean;
  _pool: Pool;
} {
  return {
    _table: table,
    _select: '*',
    _where: [],
    _orderBy: null,
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
  const { _table, _select, _where, _single, _insert, _update, _delete, _pool } = state;
  const client = await _pool.connect();
  try {
    if (_insert) {
      const cols = Object.keys(_insert).filter((k) => _insert[k] !== undefined);
      const vals = cols.map((k) => _insert[k]);
      const placeholders = cols.map((_, i) => `$${i + 1}`);
      const quotedCols = cols.map((c) => `"${c}"`).join(', ');
      const returning = state._select && state._select.includes('id') ? ' RETURNING id' : '';
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
      const q = `UPDATE ${_table} SET ${setClause} WHERE ${whereClause}`;
      await client.query(q, allVals);
      return { data: null, error: null };
    }
    if (_delete) {
      const placeholders = state._where.map((_, i) => `$${i + 1}`);
      const whereClause = state._where.map((w) => `"${w.col}" ${w.op} ${placeholders.shift()}`).join(' AND ');
      const q = `DELETE FROM ${_table} WHERE ${whereClause}`;
      await client.query(q, state._where.map((w) => w.val));
      return { data: null, error: null };
    }
    // SELECT
    let selectClause = _select === '*' ? '*' : _select;
    let fromClause = _table;
    // Untuk products selalu JOIN brand & category agar brand_name & category_name tersedia
    if (_table === 'products') {
      fromClause = `${_table} LEFT JOIN brands ON ${_table}.brand_id = brands.id LEFT JOIN product_categories ON ${_table}.category_id = product_categories.id`;
      selectClause = `${_table}.*, brands.name AS brand_name, product_categories.name AS category_name`;
    }
    if (_table === 'product_ingredients' && _select.includes('ingredients:')) {
      fromClause = `product_ingredients LEFT JOIN ingredients ON product_ingredients.ingredient_id = ingredients.id`;
      selectClause = 'ingredients.*';
    }
    const whereClause = state._where.length
      ? ' WHERE ' + state._where.map((w, i) => `"${w.col}" ${w.op} $${i + 1}`).join(' AND ')
      : '';
    const orderClause = state._orderBy
      ? ` ORDER BY "${state._orderBy.col}" ${state._orderBy.asc ? 'ASC' : 'DESC'}`
      : '';
    const limitClause = _single ? ' LIMIT 1' : '';
    const q = `SELECT ${selectClause} FROM ${fromClause}${whereClause}${orderClause}${limitClause}`;
    const r = await client.query(q, state._where.map((w) => w.val));
    let data = _single ? r.rows[0] ?? null : r.rows;
    if (_table === 'products') {
      const rows = Array.isArray(data) ? data : data ? [data] : [];
      const mapped = rows.map((row: Record<string, unknown>) => {
        const brandName = row.brand_name != null ? String(row.brand_name) : null;
        const categoryName = row.category_name != null ? String(row.category_name) : null;
        return {
          ...row,
          brand_name: brandName ?? undefined,
          category_name: categoryName ?? undefined,
          brands: brandName != null ? { name: brandName } : null,
          product_categories: categoryName != null ? { name: categoryName } : null,
        };
      });
      data = _single ? mapped[0] ?? null : mapped;
    }
    if (_table === 'product_ingredients' && Array.isArray(data)) {
      data = data.map((row: Record<string, unknown>) => ({ ingredients: row }));
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  } finally {
    client.release();
  }
}

function makeChain(state: ReturnType<typeof buildChain>): Chain {
  const promise = executeChain(state);
  return {
    then(onFulfilled?: (value: QueryResult) => unknown, onRejected?: (reason: unknown) => unknown): Promise<QueryResult> {
      return promise.then(onFulfilled, onRejected) as Promise<QueryResult>;
    },
    catch(onRejected?: (reason: unknown) => unknown): Promise<QueryResult> {
      return promise.catch(onRejected) as Promise<QueryResult>;
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
