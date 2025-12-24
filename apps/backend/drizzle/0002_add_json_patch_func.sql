-- Function to decode JSON Pointer segments (e.g., "~1" to "/" and "~0" to "~")
CREATE OR REPLACE FUNCTION decode_json_pointer_segment(segment text)
RETURNS text
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    RETURN replace(replace(segment, '~1', '/'), '~0', '~');
END;
$$;

-- Creates a function to apply a JSON patch to a note's content.
-- Modified to accept p_user_id explicitly instead of using auth.uid()
CREATE OR REPLACE FUNCTION apply_note_patch(p_note_id uuid, p_patch jsonb, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    current_content jsonb;
    note_owner_id uuid;
    op jsonb;
    v_op_type text;
    v_path_raw text[];
    v_path text[];
    v_value jsonb;
BEGIN
    -- Fetch the note and its owner's user_id from the database.
    SELECT content, owner INTO current_content, note_owner_id FROM notes WHERE id = p_note_id;

    IF current_content IS NULL THEN
        RAISE EXCEPTION 'Note not found';
    END IF;

    -- Security Check: Ensure the user calling the function is the owner of the note.
    IF note_owner_id IS DISTINCT FROM p_user_id THEN
        RAISE EXCEPTION 'Permission denied: You do not own this note.';
    END IF;

    -- Iterate through each operation in the patch array
    FOR op IN SELECT * FROM jsonb_array_elements(p_patch) LOOP
        v_op_type := op->>'op';
        
        -- Convert JSON Pointer path string (e.g., "/a/b~1c") to text array (e.g., {"a", "b/c"})
        -- First, split by '/', then decode each segment
        v_path_raw := string_to_array(trim(op->>'path', '/'), '/');
        v_path := ARRAY(SELECT decode_json_pointer_segment(s) FROM unnest(v_path_raw) AS s);
        
        v_value := op->'value'; -- Value for 'add' or 'replace' operations

        CASE v_op_type
            WHEN 'add', 'replace' THEN
                -- jsonb_set handles both add (if path doesn't exist) and replace (if path exists)
                -- The 'true' argument ensures missing keys are created.
                current_content := jsonb_set(current_content, v_path, v_value, true);
            WHEN 'remove' THEN
                -- The #- operator removes an element at the specified path
                current_content := current_content #- v_path;
            ELSE
                RAISE EXCEPTION 'Unsupported patch operation: %', v_op_type;
        END CASE;
    END LOOP;

    -- Update the note in the database with the new, patched content.
    UPDATE notes SET content = current_content, updated_at = now() WHERE id = p_note_id;
END;
$$;
