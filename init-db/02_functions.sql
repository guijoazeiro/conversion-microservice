CREATE OR REPLACE FUNCTION create_conversion_task_with_outbox(
    p_original_name VARCHAR(255),
    p_stored_name VARCHAR(255),
    p_input_path VARCHAR(255),
    p_mimetype VARCHAR(100),
    p_format VARCHAR(50),
    p_file_size BIGINT,
    p_output_path TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    new_task_id UUID;
    event_data JSONB;
BEGIN
    INSERT INTO conversion_tasks (
        original_name,
        stored_name,
        input_path,
        mimetype,
        format,
        file_size,
        output_path,
        status
    ) VALUES (
        p_original_name,
        p_stored_name,
        p_input_path,
        p_mimetype,
        p_format,
        p_file_size,
        p_output_path,
        'pending'
    )
    RETURNING id INTO new_task_id;
    
    event_data := jsonb_build_object(
        'id', new_task_id,
        'input_path', p_input_path,
        'mimetype', p_mimetype,
        'format', p_format,
        'file_size', p_file_size,
        'status', 'pending'
    );
    
    INSERT INTO outbox_events (
        aggregate_id,
        aggregate_type,
        event_type,
        event_data
    ) VALUES (
        new_task_id,
        'conversion_task',
        'CONVERSION_REQUESTED',
        event_data
    );
    
    RETURN new_task_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_task_status_with_outbox(
    p_task_id UUID,
    p_new_status VARCHAR(50),
    p_output_path TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    event_data JSONB;
    old_status VARCHAR(50);
BEGIN
    SELECT status INTO old_status 
    FROM conversion_tasks 
    WHERE id = p_task_id;
    
    IF old_status IS NULL THEN
        RETURN FALSE;
    END IF;    
   
    UPDATE conversion_tasks 
    SET 
        status = p_new_status,
        output_path = COALESCE(p_output_path, output_path),
        updated_at = NOW()
    WHERE id = p_task_id;    

    event_data := jsonb_build_object(
        'id', p_task_id,
        'oldStatus', old_status,
        'newStatus', p_new_status,
        'outputPath', p_output_path
    );   
   
    INSERT INTO outbox_events (
        aggregate_id,
        aggregate_type,
        event_type,
        event_data
    ) VALUES (
        p_task_id,
        'conversion_task',
        'CONVERSION_STATUS_CHANGED',
        event_data
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_pending_outbox_events(
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    id UUID,
    aggregate_id UUID,
    event_type VARCHAR(100),
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oe.id,
        oe.aggregate_id,
        oe.event_type,
        oe.event_data,
        oe.created_at,
        oe.retry_count
    FROM outbox_events oe
    WHERE oe.status = 'pending'
    ORDER BY oe.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mark_outbox_event_processed(
    p_event_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE outbox_events 
    SET 
        status = 'processed',
        processed_at = NOW()
    WHERE id = p_event_id AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mark_outbox_event_failed(
    p_event_id UUID,
    p_error_message TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    current_retry_count INTEGER;
    max_retry_count INTEGER;
BEGIN
    SELECT retry_count, max_retries 
    INTO current_retry_count, max_retry_count
    FROM outbox_events 
    WHERE id = p_event_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    current_retry_count := current_retry_count + 1;
    
    IF current_retry_count <= max_retry_count THEN
        UPDATE outbox_events 
        SET 
            retry_count = current_retry_count,
            error_message = p_error_message,
            status = 'pending'  
        WHERE id = p_event_id;
    ELSE
        UPDATE outbox_events 
        SET 
            retry_count = current_retry_count,
            error_message = p_error_message,
            status = 'failed'
        WHERE id = p_event_id;
    END IF;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;