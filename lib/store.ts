import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TableName, Tables } from "./types";

/**
 * Tiny data layer with two backends:
 * - Supabase (production): set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * - In-memory (local demo): used automatically when Supabase isn't configured.
 *   Data disappears on restart and is NOT shared between serverless instances.
 */

type Row<T extends TableName> = Tables[T];

export interface ListOptions<T extends TableName> {
  eq?: Partial<Record<keyof Row<T>, string>>;
  order?: { column: keyof Row<T> & string; ascending?: boolean };
  limit?: number;
}

export interface Store {
  kind: "supabase" | "memory";
  get<T extends TableName>(table: T, id: string): Promise<Row<T> | null>;
  list<T extends TableName>(table: T, opts?: ListOptions<T>): Promise<Row<T>[]>;
  insert<T extends TableName>(table: T, row: Row<T>): Promise<Row<T>>;
  update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>): Promise<Row<T>>;
  upsert<T extends TableName>(table: T, row: Row<T>): Promise<Row<T>>;
}

const keyOf = (table: TableName): string => (table === "settings" ? "key" : "id");

/* ── Memory ─────────────────────────────────────────────────── */

type MemDB = Map<TableName, Map<string, Record<string, unknown>>>;
const g = globalThis as unknown as { __runaiMem?: MemDB };

function memTable(table: TableName) {
  g.__runaiMem ??= new Map();
  let t = g.__runaiMem.get(table);
  if (!t) {
    t = new Map();
    g.__runaiMem.set(table, t);
  }
  return t;
}

const memory: Store = {
  kind: "memory",
  async get(table, id) {
    const r = memTable(table).get(id);
    return r ? (structuredClone(r) as never) : null;
  },
  async list(table, opts = {}) {
    let rows = [...memTable(table).values()];
    if (opts.eq) {
      for (const [k, v] of Object.entries(opts.eq)) rows = rows.filter((r) => r[k] === v);
    }
    if (opts.order) {
      const { column, ascending = true } = opts.order;
      rows.sort((a, b) => {
        const av = String(a[column] ?? "");
        const bv = String(b[column] ?? "");
        return ascending ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    if (opts.limit) rows = rows.slice(0, opts.limit);
    return structuredClone(rows) as never;
  },
  async insert(table, row) {
    const r = row as unknown as Record<string, unknown>;
    memTable(table).set(String(r[keyOf(table)]), structuredClone(r));
    return row;
  },
  async update(table, id, patch) {
    const t = memTable(table);
    const cur = t.get(id);
    if (!cur) throw new Error(`${table}/${id} not found`);
    const next = { ...cur, ...structuredClone(patch) };
    t.set(id, next);
    return structuredClone(next) as never;
  },
  async upsert(table, row) {
    const r = row as unknown as Record<string, unknown>;
    const id = String(r[keyOf(table)]);
    const t = memTable(table);
    t.set(id, { ...(t.get(id) ?? {}), ...structuredClone(r) });
    return row;
  },
};

/* ── Supabase ───────────────────────────────────────────────── */

let sb: SupabaseClient | null = null;
function client() {
  sb ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  return sb;
}

function check<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Supabase ${what}: ${res.error.message}`);
  return res.data;
}

const supabase: Store = {
  kind: "supabase",
  async get(table, id) {
    const res = await client().from(table).select("*").eq(keyOf(table), id).maybeSingle();
    return check(res, `get ${table}`) as never;
  },
  async list(table, opts = {}) {
    let q = client().from(table).select("*");
    for (const [k, v] of Object.entries(opts.eq ?? {})) q = q.eq(k, v as string);
    if (opts.order) q = q.order(opts.order.column, { ascending: opts.order.ascending ?? true });
    if (opts.limit) q = q.limit(opts.limit);
    return check(await q, `list ${table}`) as never;
  },
  async insert(table, row) {
    const res = await client().from(table).insert(row as never).select().single();
    return check(res, `insert ${table}`) as never;
  },
  async update(table, id, patch) {
    const res = await client().from(table).update(patch as never).eq(keyOf(table), id).select().single();
    return check(res, `update ${table}`) as never;
  },
  async upsert(table, row) {
    const res = await client().from(table).upsert(row as never).select().single();
    return check(res, `upsert ${table}`) as never;
  },
};

export const hasSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export function db(): Store {
  return hasSupabase() ? supabase : memory;
}

export const now = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();

