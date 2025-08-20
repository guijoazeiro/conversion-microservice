package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strconv"
	"sync"
	"syscall"
	"time"

	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/converter"
	"github.com/guijoazeiro/conversion-microservice/tree/main/conversion-worker/database"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	ctx         = context.Background()
	redisClient *redis.Client
	mongoClient *mongo.Client
)

type JobData struct {
	ID        string `json:"id"`
	InputPath string `json:"input_path"`
	Mimetype  string `json:"mimetype"`
	Format    string `json:"format"`
}

type Worker struct {
	id        int
	db        *database.Database
	queueName string
	wg        *sync.WaitGroup
	quit      chan bool
}

func main() {
	_ = godotenv.Load()

	redisClient = redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%s", os.Getenv("REDIS_HOST"), os.Getenv("REDIS_PORT")),
	})

	mongoClient, _ = mongo.Connect(ctx, options.Client().ApplyURI(os.Getenv("MONGO_URI")))
	db := database.New(mongoClient)

	lightWorkers := getEnvInt("LIGHT_WORKERS", 2)
	heavyWorkers := getEnvInt("HEAVY_WORKERS", 1)
	workerType := os.Getenv("WORKER_TYPE")
	var wg sync.WaitGroup
	quit := make(chan bool)

	switch workerType {
	case "light":
		log.Printf("Iniciando %d workers LIGHT", lightWorkers)
		for i := 0; i < lightWorkers; i++ {
			wg.Add(1)
			go createWorker(i+1, "light", db, &wg, quit).run()
		}
	case "heavy":
		log.Printf("Iniciando %d workers HEAVY", heavyWorkers)
		for i := 0; i < heavyWorkers; i++ {
			wg.Add(1)
			go createWorker(i+1, "heavy", db, &wg, quit).run()
		}
	default:
		log.Printf("Iniciando %d workers LIGHT e %d workers HEAVY", lightWorkers, heavyWorkers)

		for i := 0; i < lightWorkers; i++ {
			wg.Add(1)
			go createWorker(i+1, "light", db, &wg, quit).run()
		}

		for i := 0; i < heavyWorkers; i++ {
			wg.Add(1)
			go createWorker(lightWorkers+i+1, "heavy", db, &wg, quit).run()
		}
	}

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	<-c
	log.Println("Encerrando workers...")
	close(quit)
	wg.Wait()
	log.Println("Workers encerrados com sucesso")
}

func createWorker(id int, queueName string, db *database.Database, wg *sync.WaitGroup, quit chan bool) *Worker {
	return &Worker{
		id:        id,
		db:        db,
		queueName: queueName,
		wg:        wg,
		quit:      quit,
	}
}

func (w *Worker) run() {
	defer w.wg.Done()

	queueType := "LIGHT"
	if w.queueName == "heavy" {
		queueType = "HEAVY"
	}

	log.Printf("Worker %d [%s] iniciado", w.id, queueType)

	for {
		select {
		case <-w.quit:
			log.Printf("Worker %d [%s] encerrando...", w.id, queueType)
			return
		default:
			if err := w.processJob(); err != nil {
				time.Sleep(1 * time.Second)
			}
		}
	}
}

func (w *Worker) processJob() error {
	waitQueue := fmt.Sprintf("bull:%s:wait", w.queueName)

	jobID, err := redisClient.LPop(ctx, waitQueue).Result()
	if err == redis.Nil {
		time.Sleep(500 * time.Millisecond)
		return err
	}
	if err != nil {
		log.Printf("Worker %d - Erro lendo fila: %v", w.id, err)
		return err
	}

	log.Printf("Worker %d - Job ID obtido: %s", w.id, jobID)

	jobKey := fmt.Sprintf("bull:%s:%s", w.queueName, jobID)
	log.Printf("Worker %d - Buscando dados em: %s", w.id, jobKey)

	dataJSON, err := redisClient.HGet(ctx, jobKey, "data").Result()
	if err != nil {
		log.Printf("Worker %d - Erro ao buscar job data: %v", w.id, err)
		return err
	}

	log.Printf("Worker %d - Dados obtidos: %s", w.id, dataJSON)

	var job JobData
	if err := json.Unmarshal([]byte(dataJSON), &job); err != nil {
		log.Printf("Worker %d - Erro no unmarshal: %v", w.id, err)
		return err
	}

	queueType := "LIGHT"
	if w.queueName == "heavy" {
		queueType = "HEAVY"
	}

	log.Printf("Worker %d [%s] - Job [%s] recebido", w.id, queueType, job.ID)

	w.db.UpdateStatus(job.ID, "processing", "", "")

	handler := converter.GetHandler(job.Mimetype)
	if handler == nil {
		log.Printf("Worker %d - Mimetype inválido: %s", w.id, job.Mimetype)
		w.db.UpdateStatus(job.ID, "failed", "", "")
		return fmt.Errorf("mimetype inválido")
	}

	var fileName string
	if job.Format == "images" {
		fileName = fmt.Sprintf("%s.zip", job.ID)
	} else {
		fileName = fmt.Sprintf("%s.%s", job.ID, job.Format)
	}

	outputPath := fmt.Sprintf("/tmp/output/%s", fileName)

	start := time.Now()
	err = handler.Convert(job.InputPath, job.Format, outputPath)
	duration := time.Since(start)

	if err != nil {
		log.Printf("Worker %d [%s] - Job [%s] falhou após %v: %s", w.id, queueType, job.ID, duration, err)
		w.db.UpdateStatus(job.ID, "failed", "", "")
		return err
	}

	log.Printf("Worker %d [%s] - Job [%s] concluído em %v! Output: %s", w.id, queueType, job.ID, duration, outputPath)
	w.db.UpdateStatus(job.ID, "completed", outputPath, fileName)

	return nil
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
