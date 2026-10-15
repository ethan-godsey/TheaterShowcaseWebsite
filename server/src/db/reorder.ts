import { pool } from './pool'

/**
 * Tables with a sort_order column that the admin can reorder. A closed union
 * on purpose: the name is interpolated into SQL, so it must only ever come
 * from this list in code — never from a request.
 */
export type ReorderableTable = 'photos' | 'shows'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** A single UUID — check route params before they reach a uuid column, or a
 *  malformed id becomes a Postgres cast error and a misleading 500. */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value)
}

/** A non-empty list of unique UUIDs. */
export function isIdList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((id) => typeof id === 'string' && UUID.test(id)) &&
    new Set(value).size === value.length
  )
}

/**
 * Rewrite a table's order from the COMPLETE list of ids, not "move X to N":
 *   - idempotent: the same list twice gives the same result, so a retry after
 *     a lost response can't apply a shift twice
 *   - self-normalising: positions are rewritten 1..n, so gaps and ties
 *     (every row starts at 0) are fixed by the first save
 *   - direction-free: moving earlier vs later is the same operation
 *
 * One transaction, so it never half-applies. Returns 'stale' when the list
 * doesn't match the table exactly — a row was added or deleted since the
 * client loaded, and applying it would drop or misplace rows.
 */
export async function reorder(table: ReorderableTable, ids: string[]): Promise<'ok' | 'stale'> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows: current } = await client.query<{ id: string }>(
      `SELECT id FROM ${table} FOR UPDATE`,
    )
    const known = new Set(current.map((r) => r.id))
    if (current.length !== ids.length || !ids.every((id) => known.has(id))) {
      await client.query('ROLLBACK')
      return 'stale'
    }

    // position = 1-based index in the array
    await client.query(
      `UPDATE ${table} AS t
          SET sort_order = o.pos
         FROM unnest($1::uuid[]) WITH ORDINALITY AS o(id, pos)
        WHERE t.id = o.id`,
      [ids],
    )

    await client.query('COMMIT')
    return 'ok'
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}
