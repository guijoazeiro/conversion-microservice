package models

import "time"

type JobData struct {
	ID        string `json:"id"`
	InputPath string `json:"input_path"`
	Mimetype  string `json:"mimetype"`
	Format    string `json:"format"`
}

type JobStatus string

const (
	JobStatusPending    JobStatus = "pending"
	JobStatusProcessing JobStatus = "processing"
	JobStatusCompleted  JobStatus = "completed"
	JobStatusFailed     JobStatus = "failed"
)

type JobUpdate struct {
	ID       string
	Status   JobStatus
	Output   string
	Filename string
	Error    error
}

type WorkerInfo struct {
	ID        int
	Type      string
	QueueName string
	StartTime time.Time
	JobsCount int64
}

type QueueType string

const (
	QueueTypeLight QueueType = "light"
	QueueTypeHeavy QueueType = "heavy"
)
