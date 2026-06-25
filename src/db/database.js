const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { app } = require("electron");
const Database = require("better-sqlite3");

let db = null;
let dataDir = null;

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const hashPwd = (p) => crypto.createHash("sha256").update(p).digest("hex");

function stableStringify(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(stableStringify).join(",") + "]";
  const keys = Object.keys(v).sort();
  return (
    "{" +
    keys.map((k) => JSON.stringify(k) + ":" + stableStringify(v[k])).join(",") +
    "}"
  );
}
const fingerprint = (c) =>
  crypto
    .createHash("sha256")
    .update(stableStringify(c))
    .digest("hex")
    .slice(0, 16);
const fpath = (name) => path.join(dataDir, name);

function safeUnlink(name) {
  if (!name) return;
  try {
    fs.unlinkSync(fpath(name));
  } catch (e) {}
}

function initDB() {
  const userData = app.getPath("userData");
  dataDir = path.join(userData, "ballistic_data");
  fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(userData, "rocket_sim.db");
  db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT DEFAULT '',
      base_params TEXT,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS opt_records (
      id         TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      opt_config TEXT NOT NULL,
      opt_result TEXT NOT NULL,
      ran_at     TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ballistic_records (
      id                 TEXT PRIMARY KEY,
      project_id         TEXT NOT NULL,
      config_hash        TEXT NOT NULL,
      ballistic_config   TEXT NOT NULL,
      orbit_insertion    TEXT,
      events             TEXT,
      bbox               TEXT,
      launch             TEXT,
      duration           REAL,
      point_count_track  INTEGER,
      point_count_full   INTEGER,
      track_file         TEXT NOT NULL,
      ran_at             TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bl_hash ON ballistic_records(project_id, config_hash);

    CREATE TABLE IF NOT EXISTS users (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `);

  // ---- Database Migrations (自动兼容旧数据库) ----
  try {
    db.prepare("SELECT full_file FROM ballistic_records LIMIT 1").get();
  } catch (err) {
    db.exec("ALTER TABLE ballistic_records ADD COLUMN full_file TEXT;");
  }

  try {
    db.prepare("SELECT ballistic_type FROM ballistic_records LIMIT 1").get();
  } catch (err) {
    db.exec(
      "ALTER TABLE ballistic_records ADD COLUMN ballistic_type TEXT DEFAULT 'optimized';",
    );
  }

  try {
    db.prepare("SELECT opt_record_id FROM ballistic_records LIMIT 1").get();
  } catch (err) {
    db.exec(
      "ALTER TABLE ballistic_records ADD COLUMN opt_record_id TEXT DEFAULT NULL;",
    );
  }

  // 新增：名称字段
  try {
    db.prepare("SELECT name FROM opt_records LIMIT 1").get();
  } catch (err) {
    db.exec("ALTER TABLE opt_records ADD COLUMN name TEXT DEFAULT '';");
  }

  try {
    db.prepare("SELECT name FROM ballistic_records LIMIT 1").get();
  } catch (err) {
    db.exec("ALTER TABLE ballistic_records ADD COLUMN name TEXT DEFAULT '';");
  }

  const admin = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get("admin");
  if (!admin) {
    db.prepare("INSERT INTO users(username, password) VALUES(?, ?)").run(
      "admin",
      hashPwd("123456"),
    );
  }
  return db;
}

const projectOps = {
  getAll() {
    const projects = db
      .prepare("SELECT * FROM projects ORDER BY created_at DESC")
      .all();
    const getOptRecords = db.prepare(
      "SELECT * FROM opt_records WHERE project_id = ? ORDER BY ran_at DESC",
    );
    const getBallisticMeta = db.prepare(
      "SELECT * FROM ballistic_records WHERE project_id = ? ORDER BY ran_at DESC",
    );

    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      desc: p.description,
      baseParams: p.base_params ? JSON.parse(p.base_params) : null,
      createdAt: p.created_at,
      records: getOptRecords.all(p.id).map((r) => ({
        id: r.id,
        name: r.name || "",
        projectId: r.project_id,
        optConfig: JSON.parse(r.opt_config),
        result: JSON.parse(r.opt_result),
        ranAt: r.ran_at,
      })),
      ballisticRecords: getBallisticMeta.all(p.id).map((r) => ({
        id: r.id,
        name: r.name || "",
        projectId: r.project_id,
        configHash: r.config_hash,
        ballisticConfig: JSON.parse(r.ballistic_config),
        orbitInsertion: r.orbit_insertion
          ? JSON.parse(r.orbit_insertion)
          : null,
        events: r.events ? JSON.parse(r.events) : [],
        bbox: r.bbox ? JSON.parse(r.bbox) : null,
        launch: r.launch ? JSON.parse(r.launch) : null,
        duration: r.duration,
        pointCount: r.point_count_track,
        pointCountFull: r.point_count_full,
        ranAt: r.ran_at,
        fullFile: r.full_file,
        ballisticType: r.ballistic_type || "optimized",
        optRecordId: r.opt_record_id || null,
      })),
    }));
  },
  create({ name, desc, baseParams }) {
    const id = uid();
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO projects (id, name, description, base_params, created_at) VALUES (?, ?, ?, ?, ?)",
    ).run(id, name, desc || "", JSON.stringify(baseParams || {}), now);
    return {
      id,
      name,
      desc: desc || "",
      baseParams: baseParams || {},
      createdAt: now,
      records: [],
      ballisticRecords: [],
    };
  },
  rename({ projectId, name }) {
    db.prepare("UPDATE projects SET name = ? WHERE id = ?").run(
      name,
      projectId,
    );
    return true;
  },
  delete({ projectId }) {
    const recs = db
      .prepare(
        "SELECT track_file, full_file FROM ballistic_records WHERE project_id = ?",
      )
      .all(projectId);
    recs.forEach((r) => {
      safeUnlink(r.track_file);
      safeUnlink(r.full_file);
    });
    db.prepare("DELETE FROM projects WHERE id = ?").run(projectId);
    return true;
  },
};

const recordOps = {
  save({ projectId, optConfig, optResult, name }) {
    const id = uid();
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO opt_records (id, project_id, opt_config, opt_result, ran_at, name) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(
      id,
      projectId,
      JSON.stringify(optConfig),
      JSON.stringify(optResult),
      now,
      name || "",
    );
    return {
      id,
      projectId,
      name: name || "",
      optConfig,
      result: optResult,
      ranAt: now,
    };
  },
  delete({ recordId }) {
    // 连带删除该优化记录下生成的所有弹道记录及物理文件
    const linkedBallistics = db
      .prepare(
        "SELECT track_file, full_file FROM ballistic_records WHERE opt_record_id = ?",
      )
      .all(recordId);

    linkedBallistics.forEach((r) => {
      safeUnlink(r.track_file);
      safeUnlink(r.full_file);
    });

    db.prepare("DELETE FROM ballistic_records WHERE opt_record_id = ?").run(
      recordId,
    );
    db.prepare("DELETE FROM opt_records WHERE id = ?").run(recordId);
    return true;
  },
  rename({ recordId, name }) {
    db.prepare("UPDATE opt_records SET name = ? WHERE id = ?").run(
      name,
      recordId,
    );
    return true;
  },
};

const ballisticOps = {
  save({ projectId, ballisticConfig, meta, ballisticType, optRecordId, name }) {
    const safeType = ballisticType ? String(ballisticType) : "optimized";
    const safeOptId = optRecordId ? String(optRecordId) : "NONE";

    const hashPayload = {
      config: ballisticConfig,
      type: safeType,
      optId: safeOptId,
    };

    const hash = fingerprint(hashPayload);
    const now = new Date().toISOString();

    // ✅ 修改：根据 ballisticType 和 optRecordId 区分不同类型的弹道
    const existing = db
      .prepare(
        `SELECT id, track_file, full_file FROM ballistic_records 
         WHERE project_id = ? 
         AND config_hash = ? 
         AND ballistic_type = ? 
         AND (opt_record_id = ? OR (opt_record_id IS NULL AND ? IS NULL))`,
      )
      .get(
        projectId,
        hash,
        ballisticType || "optimized",
        optRecordId,
        optRecordId,
      );

    const id = existing ? existing.id : uid();

    if (existing) {
      if (existing.track_file && existing.track_file !== meta.track_file)
        safeUnlink(existing.track_file);
      if (existing.full_file && existing.full_file !== meta.full_file)
        safeUnlink(existing.full_file);
    }

    const row = {
      id,
      projectId,
      hash,
      name: name || "",
      ballisticConfig: JSON.stringify(ballisticConfig),
      orbit_insertion: JSON.stringify(meta.orbit_insertion || null),
      events: JSON.stringify(meta.events || []),
      bbox: JSON.stringify(meta.bbox || null),
      launch: JSON.stringify(meta.launch || null),
      duration: meta.duration || 0,
      ptk: meta.point_count_track || 0,
      pfl: meta.point_count_full || 0,
      trackFile: meta.track_file,
      fullFile: meta.full_file || null,
      ballisticType: ballisticType || "optimized",
      optRecordId: optRecordId || null,
      now,
    };

    if (existing) {
      db.prepare(
        `UPDATE ballistic_records SET orbit_insertion = @orbit_insertion, events = @events, bbox = @bbox, launch = @launch, duration = @duration, point_count_track = @ptk, point_count_full = @pfl, track_file = @trackFile, full_file = @fullFile, ballistic_type = @ballisticType, opt_record_id = @optRecordId, name = @name, ran_at = @now WHERE id = @id`,
      ).run(row);
    } else {
      db.prepare(
        `INSERT INTO ballistic_records (id, project_id, config_hash, ballistic_config, orbit_insertion, events, bbox, launch, duration, point_count_track, point_count_full, track_file, full_file, ballistic_type, opt_record_id, name, ran_at) VALUES (@id, @projectId, @hash, @ballisticConfig, @orbit_insertion, @events, @bbox, @launch, @duration, @ptk, @pfl, @trackFile, @fullFile, @ballisticType, @optRecordId, @name, @now)`,
      ).run(row);
    }
    return { id, overwritten: !!existing };
  },
  readTrackBuffer({ recordId }) {
    const row = db
      .prepare("SELECT track_file FROM ballistic_records WHERE id = ?")
      .get(recordId);
    if (!row || !row.track_file) return null;
    const buf = fs.readFileSync(fpath(row.track_file));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  },
  readFullBuffer(recordId) {
    const r = db
      .prepare("SELECT full_file FROM ballistic_records WHERE id = ?")
      .get(recordId);
    const buf = fs.readFileSync(path.join(dataDir, r.full_file));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  },
  list(params) {
    const query =
      params && params.projectId
        ? db
            .prepare(
              "SELECT * FROM ballistic_records WHERE project_id = ? ORDER BY ran_at DESC",
            )
            .all(params.projectId)
        : db
            .prepare("SELECT * FROM ballistic_records ORDER BY ran_at DESC")
            .all();
    return query.map((r) => ({
      id: r.id,
      name: r.name || "",
      projectId: r.project_id,
      configHash: r.config_hash,
      ballisticConfig: JSON.parse(r.ballistic_config),
      orbitInsertion: r.orbit_insertion ? JSON.parse(r.orbit_insertion) : null,
      events: r.events ? JSON.parse(r.events) : [],
      duration: r.duration,
      pointCount: r.point_count_track,
      pointCountFull: r.point_count_full,
      ranAt: r.ran_at,
      ballisticType: r.ballistic_type || "optimized",
    }));
  },
  delete({ recordId }) {
    const row = db
      .prepare(
        "SELECT track_file, full_file FROM ballistic_records WHERE id = ?",
      )
      .get(recordId);
    if (row) {
      safeUnlink(row.track_file);
      safeUnlink(row.full_file);
    }
    db.prepare("DELETE FROM ballistic_records WHERE id = ?").run(recordId);
    return true;
  },
  rename({ recordId, name }) {
    db.prepare("UPDATE ballistic_records SET name = ? WHERE id = ?").run(
      name,
      recordId,
    );
    return true;
  },
  getDataDir() {
    return dataDir;
  },
};

const authOps = {
  login({ username, password }) {
    return db
      .prepare("SELECT username FROM users WHERE username = ? AND password = ?")
      .get(username, hashPwd(password));
  },
};
module.exports = { initDB, projectOps, recordOps, ballisticOps, authOps };
