package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"time"

	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type JobData struct {
	ID       string `json:"id"`
	Path     string `json:"path"`
	Mimetype string `json:"mimetype"`
}

var (
	ctx         = context.Background()
	redisClient *redis.Client
	mongoClient *mongo.Client
	tasksCol    *mongo.Collection
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	redisClient = redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%s", os.Getenv("REDIS_HOST"), os.Getenv("REDIS_PORT")),
	})

	mongoClient, _ = mongo.Connect(ctx, options.Client().ApplyURI(os.Getenv("MONGO_URI")))
	tasksCol = mongoClient.Database("converter").Collection("tasks")

	fmt.Println("Go worker ouvindo fila...")

	for {
		jobID, err := redisClient.LPop(ctx, "bull:convert:wait").Result()
		if err == redis.Nil {
			time.Sleep(1 * time.Second)
			continue
		}
		if err != nil {
			log.Println("Erro ao obter job da fila:", err)
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

		if err := json.Unmarshal([]byte(dataJSON), &job); err != nil {
			log.Println("Erro no unmarshal:", err)
			continue
		}

		log.Printf("[%s] Job recebido", job.ID)
		updateStatus(job.ID, "processing")

		if job.Mimetype != "video/mp4" {
			log.Println("Mimetype inválido:", job.Mimetype)
			updateStatus(job.ID, "failed")
			continue
		}

		output := fmt.Sprintf("../tmp/output/%s.mp3", job.ID)
		err = convertToMp3(job.Path, output)
		if err != nil {
			log.Printf("[%s] Erro na conversão: %s\n", job.ID, err)
			updateStatus(job.ID, "failed")
			continue
		}

		log.Printf("[%s] Conversão concluída", job.ID)
		updateStatus(job.ID, "done")
	}
}

func convertToMp3(input, output string) error {
	log.Printf("Convertendo %s para %s\n", input, output)
	cmd := exec.Command("ffmpeg", "-y", "-i", input, "-vn", "-acodec", "libmp3lame", output)
	return cmd.Run()
}

func updateStatus(id, status string) {
	_, err := tasksCol.UpdateOne(ctx, bson.M{"id": id}, bson.M{"$set": bson.M{"status": status}})
	if err != nil {
		log.Printf("Erro ao atualizar status de %s: %s\n", id, err)
	}
}
