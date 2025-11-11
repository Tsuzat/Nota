export default `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS userworkspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    userworkspace INTEGER NOT NULL,
    content TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY (userworkspace) REFERENCES userworkspaces (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    workspace INTEGER NOT NULL,
    userworkspace INTEGER NOT NULL,
    favorite BOOLEAN NOT NULL DEFAULT FALSE,
    trashed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    content TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY (workspace) REFERENCES workspaces (id) ON DELETE CASCADE,
    FOREIGN KEY (userworkspace) REFERENCES userworkspaces (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workspaces_userworkspace ON workspaces (userworkspace);

CREATE TRIGGER IF NOT EXISTS trigger_update_workspaces_updated_at
  AFTER UPDATE ON workspaces
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN
      UPDATE workspaces SET updated_at = STRFTIME('%s', 'now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS trigger_update_notes_updated_at
  AFTER UPDATE ON notes
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN
      UPDATE notes SET updated_at = STRFTIME('%s', 'now') WHERE id = NEW.id;
  END;

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS userworkspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    userworkspace INTEGER NOT NULL,
    content TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY (userworkspace) REFERENCES userworkspaces (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    workspace INTEGER NOT NULL,
    userworkspace INTEGER NOT NULL,
    favorite BOOLEAN NOT NULL DEFAULT FALSE,
    trashed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    content TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY (workspace) REFERENCES workspaces (id) ON DELETE CASCADE,
    FOREIGN KEY (userworkspace) REFERENCES userworkspaces (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workspaces_userworkspace ON workspaces (userworkspace);

CREATE TRIGGER IF NOT EXISTS trigger_update_workspaces_updated_at
  AFTER UPDATE ON workspaces
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN
      UPDATE workspaces SET updated_at = STRFTIME('%s', 'now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS trigger_update_notes_updated_at
  AFTER UPDATE ON notes
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN
      UPDATE notes SET updated_at = STRFTIME('%s', 'now') WHERE id = NEW.id;
  END;

CREATE TABLE IF NOT EXISTS content_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    content TEXT NOT NULL DEFAULT '{}',
    added_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_history_note_added_at ON content_history (note_id, added_at DESC);

CREATE TRIGGER IF NOT EXISTS trigger_notes_content_history_insert
AFTER UPDATE ON notes
FOR EACH ROW
WHEN (NEW.content IS NOT OLD.content) AND (NEW.content != OLD.content)
BEGIN
  INSERT INTO content_history (note_id, content, added_at)
  VALUES (OLD.id, OLD.content, STRFTIME('%s', 'now'));
  DELETE FROM content_history
  WHERE note_id = OLD.id
    AND id NOT IN (
      SELECT id FROM content_history
      WHERE note_id = OLD.id
      ORDER BY added_at DESC, id DESC
      LIMIT 100
    );
END;
`;
