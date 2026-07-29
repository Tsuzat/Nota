-- Migration for Note Versions (Snapshots)
-- Apply this manually to the PostgreSQL database

CREATE TABLE IF NOT EXISTS note_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    content_compressed BYTEA NOT NULL,
    content_hash TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    compressed_size_bytes INTEGER NOT NULL,
    version_type TEXT NOT NULL DEFAULT 'auto' CHECK (version_type IN ('auto', 'manual', 'restore')),
    label TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_note_versions_note_id ON note_versions(note_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_note_versions_manual ON note_versions(note_id) WHERE version_type = 'manual';
CREATE INDEX IF NOT EXISTS idx_note_versions_hash ON note_versions(note_id, content_hash);
CREATE INDEX IF NOT EXISTS idx_note_versions_workspace_id ON note_versions(workspace_id);

-- Function to thin auto versions for a specific note
CREATE OR REPLACE FUNCTION thin_note_auto_versions(p_note_id UUID)
RETURNS void AS $$
DECLARE
    v_now TIMESTAMPTZ := now();
BEGIN
    -- Tier 1: older than 30 days -> delete all auto snapshots
    DELETE FROM note_versions
    WHERE note_id = p_note_id
      AND version_type = 'auto'
      AND created_at < v_now - INTERVAL '30 days';

    -- Tier 2: 7d–30d old -> keep at most 1 per calendar day
    DELETE FROM note_versions nv
    USING (
        SELECT id,
               row_number() OVER (
                   PARTITION BY date_trunc('day', created_at)
                   ORDER BY created_at DESC
               ) AS rn
        FROM note_versions
        WHERE note_id = p_note_id
          AND version_type = 'auto'
          AND created_at < v_now - INTERVAL '7 days'
          AND created_at >= v_now - INTERVAL '30 days'
    ) dupes
    WHERE nv.id = dupes.id AND dupes.rn > 1;

    -- Tier 3: 24h–7d old -> keep at most 1 per hour
    DELETE FROM note_versions nv
    USING (
        SELECT id,
               row_number() OVER (
                   PARTITION BY date_trunc('hour', created_at)
                   ORDER BY created_at DESC
               ) AS rn
        FROM note_versions
        WHERE note_id = p_note_id
          AND version_type = 'auto'
          AND created_at < v_now - INTERVAL '24 hours'
          AND created_at >= v_now - INTERVAL '7 days'
    ) dupes
    WHERE nv.id = dupes.id AND dupes.rn > 1;

    -- Anything under 24h old is left untouched, at full 10-minute granularity.
END;
$$ LANGUAGE plpgsql;

-- Trigger to run thinning after every auto-snapshot insert
CREATE OR REPLACE FUNCTION trg_thin_note_auto_versions()
RETURNS trigger AS $$
BEGIN
    IF NEW.version_type = 'auto' THEN
        PERFORM thin_note_auto_versions(NEW.note_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS note_versions_thin_after_insert ON note_versions;
CREATE TRIGGER note_versions_thin_after_insert
AFTER INSERT ON note_versions
FOR EACH ROW
EXECUTE FUNCTION trg_thin_note_auto_versions();
