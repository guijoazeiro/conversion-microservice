package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/internal/config"
	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/internal/database"
	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/internal/queue"
	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/internal/worker"
	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/pkg/logger"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		logger.Error("Failed to load configuration: %v", err)
	}

	app, err := initializeServices(cfg)
	if err != nil {
		logger.Error("Failed to initialize services: %v", err)
	}
	defer app.cleanup()

	if err := app.run(); err != nil {
		logger.Error("Application error: %v", err)
	}
}

type App struct {
	config *config.Config
	pool   *worker.Pool
	queue  queue.Queue
	db     database.Repository
}

func initializeServices(cfg *config.Config) (*App, error) {
	redisQueue := queue.NewRedisQueue(cfg.Redis.Addr)

	ctx := context.Background()
	if err := redisQueue.Ping(ctx); err != nil {
		return nil, err
	}
	logger.Info("Connected to Redis")

	db, err := database.NewPostgresRepository(cfg.Database.DSN)
	if err != nil {
		return nil, err
	}
	logger.Info("Connected to PostgreSQL")

	poolConfig := worker.PoolConfig{
		LightWorkers: cfg.Worker.LightWorkers,
		HeavyWorkers: cfg.Worker.HeavyWorkers,
		WorkerType:   cfg.Worker.Type,
	}
	workerPool := worker.NewPool(poolConfig, redisQueue, db)

	return &App{
		config: cfg,
		pool:   workerPool,
		queue:  redisQueue,
		db:     db,
	}, nil
}

func (app *App) run() error {
	ctx := context.Background()

	app.pool.Start(ctx)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	<-quit
	logger.Info("Shutdown signal received")

	return nil
}

func (app *App) cleanup() {
	logger.Info("Cleaning up resources...")

	app.pool.Stop()

	if err := app.db.Close(); err != nil {
		logger.Error("Error closing database: %v", err)
	}

	if err := app.queue.Close(); err != nil {
		logger.Error("Error closing Redis: %v", err)
	}

	logger.Info("Cleanup completed")
}
