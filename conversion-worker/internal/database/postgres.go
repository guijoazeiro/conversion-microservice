package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/internal/models"
	_ "github.com/lib/pq"
)

type Repository interface {
	UpdateJobStatus(ctx context.Context, update models.JobUpdate) error
	GetJobByID(ctx context.Context, id string) (*models.JobData, error)
	Close() error
	Ping(ctx context.Context) error
}

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(dsn string) (*PostgresRepository, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed ro connect to PostgreSQL: %w", err)
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(time.Hour)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping PostgreSQL: %w", err)
	}

	return &PostgresRepository{db: db}, nil
}

func (r *PostgresRepository) UpdateJobStatus(ctx context.Context, update models.JobUpdate) error {
	var outputParam sql.NullString
	if update.Output != "" {
		outputParam = sql.NullString{String: update.Output, Valid: true}
	}
	query := "SELECT public.update_task_status_with_outbox($1::uuid, $2::varchar, $3::text)"
	_, err := r.db.ExecContext(ctx, query, update.ID, update.Status, outputParam)
	if err != nil {
		return fmt.Errorf("failed to update job status for ID %s: %w", update.ID, err)
	}

	return nil
}

func (r *PostgresRepository) GetJobByID(ctx context.Context, id string) (*models.JobData, error) {
	query := `
		SELECT id, input_path, mimetype, format 
		FROM jobs 
		WHERE id = $1
	`
	var job models.JobData
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&job.ID,
		&job.InputPath,
		&job.Mimetype,
		&job.Format,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("job with ID %s not found", id)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get job by ID %s: %w", id, err)
	}

	return &job, nil

}

func (r *PostgresRepository) Ping(ctx context.Context) error {
	return r.db.PingContext(ctx)
}

func (r *PostgresRepository) Close() error {
	return r.db.Close()
}
