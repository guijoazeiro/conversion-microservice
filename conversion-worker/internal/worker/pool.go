package worker

import (
	"context"
	"sync"

	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/internal/database"
	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/internal/models"
	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/internal/queue"
	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/pkg/logger"
)

type Pool struct {
	workers []Worker
	wg      sync.WaitGroup
	cancel  context.CancelFunc
}

type PoolConfig struct {
	LightWorkers int
	HeavyWorkers int
	WorkerType   string
}

func NewPool(config PoolConfig, q queue.Queue, db database.Repository) *Pool {
	pool := &Pool{}

	switch config.WorkerType {
	case "light":
		logger.Info("Starting %d LIGHT workers", config.LightWorkers)
		pool.createWorkers(config.LightWorkers, models.QueueTypeLight, q, db)
	case "heavy":
		logger.Info("Starting %d HEAVY workers", config.HeavyWorkers)
		pool.createWorkers(config.HeavyWorkers, models.QueueTypeHeavy, q, db)
	default:
		logger.Info("Starting %d LIGHT and %d HEAVY workers", config.LightWorkers, config.HeavyWorkers)
		pool.createWorkers(config.LightWorkers, models.QueueTypeLight, q, db)
		offset := len(pool.workers)
		pool.createHeavyWorkers(config.HeavyWorkers, offset, q, db)
	}

	return pool
}

func (p *Pool) createWorkers(count int, queueType models.QueueType, q queue.Queue, db database.Repository) {
	for i := 0; i < count; i++ {
		worker := New(i+1, queueType, q, db)
		p.workers = append(p.workers, *worker)
	}
}

func (p *Pool) createHeavyWorkers(count, offset int, q queue.Queue, db database.Repository) {
	for i := 0; i < count; i++ {
		worker := New(offset+i+1, models.QueueTypeHeavy, q, db)
		p.workers = append(p.workers, *worker)
	}
}

func (p *Pool) Start(ctx context.Context) {
	ctx, p.cancel = context.WithCancel(ctx)

	for i := range p.workers {
		p.wg.Add(1)
		go func(worker *Worker) {
			defer p.wg.Done()
			if err := worker.Start(ctx); err != nil && err != context.Canceled {
				logger.Error("Worker %d stopped with error: %v", worker.info.ID, err)
			}
		}(&p.workers[i])
	}
}

func (p *Pool) Stop() {
	logger.Info("Stopping worker pool...")
	if p.cancel != nil {
		p.cancel()
	}
	p.wg.Wait()
	logger.Info("Worker pool stopped successfully")
}

func (p *Pool) GetWorkerInfo() []models.WorkerInfo {
	info := make([]models.WorkerInfo, len(p.workers))
	for i, worker := range p.workers {
		info[i] = worker.GetInfo()
	}
	return info
}
