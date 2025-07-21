package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
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
	ID       string `json:"id"`
	Path     string `json:"path"`
	Mimetype string `json:"mimetype"`
	Format   string `json:"format"`
}

func main() {
	_ = godotenv.Load()

	redisClient = redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%s", os.Getenv("REDIS_HOST"), os.Getenv("REDIS_PORT")),
	})

	mongoClient, _ = mongo.Connect(ctx, options.Client().ApplyURI(os.Getenv("MONGO_URI")))
	db := database.New(mongoClient)

	fmt.Println("Go worker ouvindo fila...")

	for {
		jobID, err := redisClient.LPop(ctx, "bull:convert:wait").Result()
		if err == redis.Nil {
			time.Sleep(1 * time.Second)
			continue
		}
		if err != nil {
			log.Println("Erro lendo fila:", err)
			continue
		}

		jobKey := "bull:convert:" + jobID
		dataJSON, err := redisClient.HGet(ctx, jobKey, "data").Result()
		if err != nil {
			log.Println("Erro ao buscar job data:", err)
			continue
		}

		var job JobData
		if err := json.Unmarshal([]byte(dataJSON), &job); err != nil {
			log.Println("Erro no unmarshal:", err)
			continue
		}

		log.Printf("[%s] Job recebido", job.ID)
		log.Printf("JobData: %+v\n", job)

		db.UpdateStatus(job.ID, "processing", "")

		handler := converter.GetHandler(job.Mimetype)
		if handler == nil {
			log.Println("Mimetype inválido:", job.Mimetype)
			db.UpdateStatus(job.ID, "failed", "")
			continue
		}

		outputPath := fmt.Sprintf("../tmp/output/%s.%s", job.ID, job.Format)
		err = handler.Convert(job.Path, job.Format, outputPath)
		if err != nil {
			log.Printf("[%s] Erro na conversão: %s\n", job.ID, err)
			db.UpdateStatus(job.ID, "failed", "")
			continue
		}

		log.Printf("[%s] Conversão concluída! Output: %s", job.ID, outputPath)
		db.UpdateStatus(job.ID, "done", outputPath)
	}
}
