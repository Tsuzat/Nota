CREATE OR REPLACE FUNCTION delete_revoked_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM sessions WHERE revoked = true;
END;
$$;

-- Schedule the job to run daily at midnight
-- Note: This requires the pg_cron extension to be enabled
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule('delete-revoked-sessions-daily', '0 0 * * *', 'SELECT delete_revoked_sessions()');
    END IF;
END
$$;
