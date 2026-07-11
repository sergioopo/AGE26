import { neon } from "@neondatabase/serverless";
import process from "node:process";

let schemaReady;

function sql() {
  if (!process.env.DATABASE_URL) throw new Error("Falta configurar DATABASE_URL en Vercel.");
  return neon(process.env.DATABASE_URL);
}

async function ensureSchema() {
  if (!schemaReady) {
    const db = sql();
    schemaReady = db.transaction([
      db`CREATE TABLE IF NOT EXISTS sync_runs (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        started_at TIMESTAMPTZ NOT NULL,
        completed_at TIMESTAMPTZ,
        status TEXT NOT NULL,
        participant_count INTEGER NOT NULL DEFAULT 0,
        new_count INTEGER NOT NULL DEFAULT 0,
        changed_count INTEGER NOT NULL DEFAULT 0,
        error_message TEXT
      )`,
      db`CREATE TABLE IF NOT EXISTS participants (
        drd TEXT PRIMARY KEY,
        group_name TEXT NOT NULL,
        province TEXT,
        raw_p1 DOUBLE PRECISION NOT NULL,
        raw_p2 DOUBLE PRECISION NOT NULL,
        first_seen_at TIMESTAMPTZ NOT NULL,
        last_seen_at TIMESTAMPTZ NOT NULL,
        last_sync_id BIGINT NOT NULL
      )`,
      db`CREATE TABLE IF NOT EXISTS participant_snapshots (
        sync_id BIGINT NOT NULL REFERENCES sync_runs(id),
        drd TEXT NOT NULL,
        group_name TEXT NOT NULL,
        province TEXT,
        raw_p1 DOUBLE PRECISION NOT NULL,
        raw_p2 DOUBLE PRECISION NOT NULL,
        PRIMARY KEY (sync_id, drd)
      )`,
      db`CREATE INDEX IF NOT EXISTS participant_snapshots_drd_idx ON participant_snapshots (drd, sync_id)`,
    ]);
  }
  await schemaReady;
}

export async function getLatestSync() {
  await ensureSchema();
  const rows = await sql()`SELECT * FROM sync_runs WHERE status = 'completed' ORDER BY id DESC LIMIT 1`;
  return rows[0] || null;
}

export async function getCurrentParticipants() {
  const current = await getLatestSync();
  if (!current) return [];
  return sql()`SELECT drd, province, raw_p1 AS "rawP1", raw_p2 AS "rawP2", group_name AS "groupName" FROM participant_snapshots WHERE sync_id = ${current.id}`;
}

export async function getNewScores() {
  await ensureSchema();
  const runs = await sql()`SELECT * FROM sync_runs WHERE status = 'completed' ORDER BY id DESC LIMIT 2`;
  const [sync, previousSync] = runs;
  const recentScores = await sql()`
    SELECT drd, province, raw_p1 AS "rawP1", raw_p2 AS "rawP2", group_name AS "groupName", first_seen_at AS "firstSeenAt"
    FROM participants
    WHERE first_seen_at >= NOW() - INTERVAL '7 days'
      AND first_seen_at > COALESCE(
        (SELECT completed_at FROM sync_runs WHERE status = 'completed' ORDER BY id ASC LIMIT 1),
        NOW()
      )
    ORDER BY first_seen_at DESC, raw_p1 + raw_p2 DESC
  `;
  if (!sync || !previousSync) return { sync: sync || null, previousSync: previousSync || null, scores: [], recentScores };
  const scores = await sql()`
    SELECT drd, province, raw_p1 AS "rawP1", raw_p2 AS "rawP2", group_name AS "groupName"
    FROM participant_snapshots current_snapshot
    WHERE sync_id = ${sync.id}
      AND NOT EXISTS (
        SELECT 1 FROM participant_snapshots previous_snapshot
        WHERE previous_snapshot.sync_id = ${previousSync.id} AND previous_snapshot.drd = current_snapshot.drd
      )
    ORDER BY raw_p1 + raw_p2 DESC
  `;
  return { sync, previousSync, scores, recentScores };
}

export async function saveSync(participants) {
  await ensureSchema();
  const db = sql();
  const payload = JSON.stringify(participants);
  const previous = await getLatestSync();
  const priorDrds = previous ? new Set((await db`SELECT drd FROM participant_snapshots WHERE sync_id = ${previous.id}`).map(({ drd }) => drd)) : new Set();
  const [run] = await db`INSERT INTO sync_runs (started_at, status) VALUES (NOW(), 'running') RETURNING id`;
  await db`WITH incoming AS (SELECT * FROM jsonb_to_recordset(${payload}::jsonb) AS row(drd TEXT, "groupName" TEXT, province TEXT, "rawP1" DOUBLE PRECISION, "rawP2" DOUBLE PRECISION)) INSERT INTO participants (drd, group_name, province, raw_p1, raw_p2, first_seen_at, last_seen_at, last_sync_id) SELECT drd, "groupName", province, "rawP1", "rawP2", NOW(), NOW(), ${run.id} FROM incoming ON CONFLICT (drd) DO UPDATE SET group_name = EXCLUDED.group_name, province = EXCLUDED.province, raw_p1 = EXCLUDED.raw_p1, raw_p2 = EXCLUDED.raw_p2, last_seen_at = NOW(), last_sync_id = EXCLUDED.last_sync_id`;
  await db`WITH incoming AS (SELECT * FROM jsonb_to_recordset(${payload}::jsonb) AS row(drd TEXT, "groupName" TEXT, province TEXT, "rawP1" DOUBLE PRECISION, "rawP2" DOUBLE PRECISION)) INSERT INTO participant_snapshots (sync_id, drd, group_name, province, raw_p1, raw_p2) SELECT ${run.id}, drd, "groupName", province, "rawP1", "rawP2" FROM incoming`;
  const [completed] = await db`UPDATE sync_runs SET completed_at = NOW(), status = 'completed', participant_count = ${participants.length}, new_count = ${participants.filter(({ drd }) => !priorDrds.has(drd)).length}, changed_count = 0 WHERE id = ${run.id} RETURNING *`;
  return completed;
}
