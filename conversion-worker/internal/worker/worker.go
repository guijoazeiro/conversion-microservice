package worker

import (
	"context"
	"fmt"
	"time"

	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/internal/converter"
	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/internal/database"
	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/internal/models"
	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/internal/queue"
	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/pkg/logger"
)

type Worker struct {
	info      models.WorkerInfo
	queue     queue.Queue
	db        database.Repository
	converter converter.Registry
}

func New(id int, queueType models.QueueType, q queue.Queue, db database.Repository) *Worker {
	return &Worker{
		info: models.WorkerInfo{
			ID:        id,
			Type:      string(queueType),
			QueueName: string(queueType),
			StartTime: time.Now(),
		},
		queue:     q,
		db:        db,
		converter: converter.NewRegistry(),
	}
}

func (w *Worker) Start(ctx context.Context) error {
	logger.Info("Worker %d [%s] starting...", w.info.ID, w.info.Type)

	for {
		select {
		case <-ctx.Done():
			logger.Info("Worker %d [%s] stopping...", w.info.ID, w.info.Type)
			return ctx.Err()
		default:
			if err := w.processNextJob(ctx); err != nil {
				time.Sleep(1 * time.Second)
			}
		}
	}
}

func (w *Worker) processNextJob(ctx context.Context) error {
	job, err := w.queue.PopJob(ctx, w.info.QueueName)
	if err != nil {
		logger.Error("Worker %d - Error popping job: %v", w.info.ID, err)
		return err
	}

	if job == nil {
		logger.Debug("Worker %d [%s] - No jobs available, waiting...", w.info.ID, w.info.Type)
		time.Sleep(500 * time.Millisecond)
		return nil
	}

	logger.Info("Worker %d [%s] - Processing job %s", w.info.ID, w.info.Type, job.ID)

	update := models.JobUpdate{
		ID:     job.ID,
		Status: models.JobStatusProcessing,
	}
	if err := w.db.UpdateJobStatus(ctx, update); err != nil {
		logger.Warn("Worker %d - Error updating job status to processing: %v", w.info.ID, err)
	}

	start := time.Now()
	err = w.processJob(ctx, job)
	duration := time.Since(start)

	if err != nil {
		logger.Error("Worker %d [%s] - Job %s failed after %v: %v",
			w.info.ID, w.info.Type, job.ID, duration, err)

		update.Status = models.JobStatusFailed
		update.Error = err
		if dbErr := w.db.UpdateJobStatus(ctx, update); dbErr != nil {
			logger.Error("Worker %d - Error updating job status to failed: %v", w.info.ID, dbErr)
		}
		return err
	}

	logger.Info("Worker %d [%s] - Job %s completed in %v",
		w.info.ID, w.info.Type, job.ID, duration)

	w.info.JobsCount++
	return nil
}

func (w *Worker) processJob(ctx context.Context, job *models.JobData) error {
	conv, err := w.converter.GetConverter(job.Mimetype)
	if err != nil {
		return fmt.Errorf("unsupported mimetype %s: %w", job.Mimetype, err)
	}

	var fileName string
	if job.Format == "images" {
		fileName = fmt.Sprintf("%s.zip", job.ID)
	} else {
		fileName = fmt.Sprintf("%s.%s", job.ID, job.Format)
	}
	outputPath := fmt.Sprintf("/tmp/output/%s", fileName)

	if err := conv.Convert(ctx, job.InputPath, job.Format, outputPath); err != nil {
		return fmt.Errorf("conversion failed: %w", err)
	}

	update := models.JobUpdate{
		ID:       job.ID,
		Status:   models.JobStatusCompleted,
		Output:   outputPath,
		Filename: fileName,
	}

	return w.db.UpdateJobStatus(ctx, update)
}

func (w *Worker) GetInfo() models.WorkerInfo {
	return w.info
}
