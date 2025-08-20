CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE conversion_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  input_path VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  format VARCHAR(50) NOT NULL,
  file_size BIGINT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  error_message TEXT,
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  output_path TEXT,
  output_size BIGINT,
  
  CONSTRAINT chk_status CHECK (status IN ('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled'))
);

CREATE TABLE outbox_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL DEFAULT 'conversion_task',
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  
  CONSTRAINT chk_outbox_status CHECK (status IN ('pending', 'processing', 'processed', 'failed'))
);

CREATE INDEX idx_conversion_tasks_status ON conversion_tasks(status);
CREATE INDEX idx_conversion_tasks_created_at ON conversion_tasks(created_at);
CREATE INDEX idx_conversion_tasks_format ON conversion_tasks(format);
CREATE INDEX idx_conversion_tasks_mimetype ON conversion_tasks(mimetype);
CREATE INDEX idx_conversion_tasks_queued ON conversion_tasks(status, created_at) WHERE status = 'queued';

CREATE INDEX idx_outbox_events_status ON outbox_events(status);
CREATE INDEX idx_outbox_events_created_at ON outbox_events(created_at);
CREATE INDEX idx_outbox_events_aggregate_id ON outbox_events(aggregate_id);
CREATE INDEX idx_outbox_events_event_type ON outbox_events(event_type);
CREATE INDEX idx_outbox_events_pending ON outbox_events(status, created_at) WHERE status = 'pending';

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversion_tasks_updated_at 
    BEFORE UPDATE ON conversion_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION cleanup_processed_outbox_events(days_old INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM outbox_events 
    WHERE status = 'processed' 
    AND processed_at < NOW() - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;