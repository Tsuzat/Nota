export default `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS userworkspaces (
    id UUID PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL
);

INSERT INTO userworkspaces (id, name, icon)
SELECT 
    '92e7887a-7ede-464b-888c-621e2fc3d43c',
    'Personal',
    'lucide:User'
WHERE NOT EXISTS (SELECT 1 FROM userworkspaces);

CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (STRFTIME('%s', 'now')),
    userworkspace UUID NOT NULL,
    content TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY (userworkspace) REFERENCES userworkspaces (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    workspace UUID NOT NULL,
    userworkspace UUID NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_notes_userworkspace ON notes (userworkspace);
`;
