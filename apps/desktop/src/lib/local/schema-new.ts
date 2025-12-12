export default `
PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

-- =====================================================
-- 1. PREPARE ID MAPPINGS
-- =====================================================

-- Map for UserWorkspaces
CREATE TEMP TABLE map_uw (old_id INTEGER, new_id TEXT);
INSERT INTO map_uw (old_id, new_id) 
SELECT id, lower(hex(randomblob(16))) FROM userworkspaces;

-- Map for Workspaces
CREATE TEMP TABLE map_w (old_id INTEGER, new_id TEXT);
INSERT INTO map_w (old_id, new_id) 
SELECT id, lower(hex(randomblob(16))) FROM workspaces;

-- Map for Notes
CREATE TEMP TABLE map_n (old_id INTEGER, new_id TEXT);
INSERT INTO map_n (old_id, new_id) 
SELECT id, lower(hex(randomblob(16))) FROM notes;

-- =====================================================
-- 2. RENAME OLD TABLES & DROP OLD ARTIFACTS
-- We must drop the old indexes/triggers to free up their names
-- =====================================================

ALTER TABLE userworkspaces RENAME TO userworkspaces_old;
ALTER TABLE workspaces RENAME TO workspaces_old;
ALTER TABLE notes RENAME TO notes_old;
ALTER TABLE content_history RENAME TO content_history_old;

-- FIX: Drop the old indexes so we can reuse the names
DROP INDEX IF EXISTS idx_workspaces_userworkspace;
DROP INDEX IF EXISTS idx_content_history_note_added_at;

-- FIX: Drop the old triggers so we can reuse the names
DROP TRIGGER IF EXISTS trigger_update_workspaces_updated_at;
DROP TRIGGER IF EXISTS trigger_update_notes_updated_at;
DROP TRIGGER IF EXISTS trigger_notes_content_history_insert;

-- =====================================================
-- 3. CREATE NEW TABLE STRUCTURE (UUIDs)
-- =====================================================

CREATE TABLE userworkspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL
);

CREATE TABLE workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    userworkspace TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY (userworkspace) REFERENCES userworkspaces (id) ON DELETE CASCADE
);

CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    workspace TEXT NOT NULL,
    userworkspace TEXT NOT NULL,
    favorite BOOLEAN NOT NULL DEFAULT FALSE,
    trashed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    content TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY (workspace) REFERENCES workspaces (id) ON DELETE CASCADE,
    FOREIGN KEY (userworkspace) REFERENCES userworkspaces (id) ON DELETE CASCADE
);

CREATE TABLE content_history (
    id TEXT PRIMARY KEY,
    note_id TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '{}',
    added_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE
);

-- =====================================================
-- 4. MIGRATE DATA USING MAPS
-- =====================================================

-- Migrate UserWorkspaces
INSERT INTO userworkspaces (id, name, icon)
SELECT 
    m.new_id, 
    old.name, 
    old.icon
FROM userworkspaces_old old
JOIN map_uw m ON old.id = m.old_id;

-- Migrate Workspaces
INSERT INTO workspaces (id, name, icon, created_at, updated_at, userworkspace, content)
SELECT 
    m.new_id,
    old.name,
    old.icon,
    old.created_at,
    old.updated_at,
    mu.new_id,
    old.content
FROM workspaces_old old
JOIN map_w m ON old.id = m.old_id
JOIN map_uw mu ON old.userworkspace = mu.old_id;

-- Migrate Notes
INSERT INTO notes (id, name, icon, workspace, userworkspace, favorite, trashed, created_at, updated_at, content)
SELECT 
    mn.new_id,
    old.name,
    old.icon,
    mw.new_id,
    mu.new_id,
    old.favorite,
    old.trashed,
    old.created_at,
    old.updated_at,
    old.content
FROM notes_old old
JOIN map_n mn ON old.id = mn.old_id
JOIN map_w mw ON old.workspace = mw.old_id
JOIN map_uw mu ON old.userworkspace = mu.old_id;

-- Migrate Content History
INSERT INTO content_history (id, note_id, content, added_at)
SELECT 
    lower(hex(randomblob(16))),
    mn.new_id,
    old.content,
    old.added_at
FROM content_history_old old
JOIN map_n mn ON old.note_id = mn.old_id;

-- =====================================================
-- 5. RECREATE INDICES & TRIGGERS
-- =====================================================

CREATE INDEX idx_workspaces_userworkspace ON workspaces (userworkspace);
CREATE INDEX idx_content_history_note_added_at ON content_history (note_id, added_at DESC);

CREATE TRIGGER trigger_update_workspaces_updated_at
  AFTER UPDATE ON workspaces
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN
      UPDATE workspaces SET updated_at = STRFTIME('%s', 'now') WHERE id = NEW.id;
  END;

CREATE TRIGGER trigger_update_notes_updated_at
  AFTER UPDATE ON notes
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN
      UPDATE notes SET updated_at = STRFTIME('%s', 'now') WHERE id = NEW.id;
  END;

CREATE TRIGGER trigger_notes_content_history_insert
AFTER UPDATE ON notes
FOR EACH ROW
WHEN (NEW.content IS NOT OLD.content) AND (NEW.content != OLD.content)
BEGIN
  INSERT INTO content_history (id, note_id, content, added_at)
  VALUES (lower(hex(randomblob(16))), OLD.id, OLD.content, STRFTIME('%s', 'now'));
  
  DELETE FROM content_history
  WHERE note_id = OLD.id
    AND id NOT IN (
      SELECT id FROM content_history
      WHERE note_id = OLD.id
      ORDER BY added_at DESC
      LIMIT 100
    );
END;

-- =====================================================
-- 6. CLEANUP
-- =====================================================

DROP TABLE userworkspaces_old;
DROP TABLE workspaces_old;
DROP TABLE notes_old;
DROP TABLE content_history_old;

DROP TABLE map_uw;
DROP TABLE map_w;
DROP TABLE map_n;

COMMIT;

PRAGMA foreign_keys = ON;
`;
