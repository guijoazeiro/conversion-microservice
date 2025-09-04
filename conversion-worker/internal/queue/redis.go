package queue

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/internal/models"
	"github.com/redis/go-redis/v9"
)

type Queue interface {
	PopJob(ctx context.Context, queueName string) (*models.JobData, error)
	Close() error
	Ping(ctx context.Context) error
}

type RedisQueue struct {
	client *redis.Client
}

func NewRedisQueue(addr string) *RedisQueue {
	client := redis.NewClient(&redis.Options{
		Addr:         addr,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		PoolSize:     10,
		MinIdleConns: 5,
	})
	return &RedisQueue{client: client}
}

func (q *RedisQueue) PopJob(ctx context.Context, queueName string) (*models.JobData, error) {
	waitQueue := fmt.Sprintf("bull:%s:wait", queueName)

	jobID, err := q.client.LPop(ctx, waitQueue).Result()

	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to pop job from queue %s: %w", queueName, err)
	}

	jobKey := fmt.Sprintf("bull:%s:%s", queueName, jobID)

	dataJSON, err := q.client.HGet(ctx, jobKey, "data").Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get job data from queue %s: %w", queueName, err)
	}

	var job models.JobData
	if err := json.Unmarshal([]byte(dataJSON), &job); err != nil {
		return nil, fmt.Errorf("failed to unmarshal job data: %w", err)
	}

	return &job, nil
}

func (q *RedisQueue) Ping(ctx context.Context) error {
	return q.client.Ping(ctx).Err()
}

func (q *RedisQueue) Close() error {
	return q.client.Close()
}
