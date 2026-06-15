export default `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    content TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY NOT NULL,
    workspace_id UUID NOT NULL,
    parent_note_id UUID,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '{}',
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    FOREIGN KEY (parent_note_id) REFERENCES notes (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY NOT NULL,
    workspace_id UUID NOT NULL,
    note_id UUID,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    deleted_at INTEGER,
    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
    FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_workspace_id ON notes (workspace_id);
CREATE INDEX IF NOT EXISTS idx_notes_parent_note_id ON notes (parent_note_id);
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes (deleted_at);

CREATE INDEX IF NOT EXISTS idx_assets_workspace_id ON assets (workspace_id);
CREATE INDEX IF NOT EXISTS idx_assets_note_id ON assets (note_id);
CREATE INDEX IF NOT EXISTS idx_assets_deleted_at ON assets (deleted_at);

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

CREATE TRIGGER IF NOT EXISTS trigger_update_assets_updated_at
  AFTER UPDATE ON assets
  FOR EACH ROW
  WHEN NEW.updated_at = OLD.updated_at
  BEGIN
      UPDATE assets SET updated_at = STRFTIME('%s', 'now') WHERE id = NEW.id;
  END;
`;
