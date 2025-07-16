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
	Format   string `json:"format"`
}

var (
	ctx         = context.Background()
	redisClient *redis.Client
	mongoClient *mongo.Client
	tasksCol    *mongo.Collection
)

func main() {
	_ = godotenv.Load()

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
		updateStatus(job.ID, "processing", "")

		if job.Mimetype != "video/mp4" && job.Mimetype != "audio/wav" {
			log.Println("Mimetype inválido:", job.Mimetype)
			updateStatus(job.ID, "failed", "")
			continue
		}

		outputPath := fmt.Sprintf("../tmp/output/%s.%s", job.ID, job.Format)
		err = convertToFormat(job.Path, job.Format, outputPath)
		if err != nil {
			log.Printf("[%s] Erro na conversão: %s\n", job.ID, err)
			updateStatus(job.ID, "failed", "")
			continue
		}

		log.Printf("[%s] Conversão concluída", job.ID)
		updateStatus(job.ID, "done", outputPath)
	}
}

func convertToFormat(input, format, output string) error {
	args := []string{"-y", "-i", input}

	switch format {
	case "mp3":
		args = append(args, "-vn", "-acodec", "libmp3lame", output)
	case "avi":
		args = append(args, "-c:v", "libx264", "-f", "avi", output)
	case "wav":
		args = append(args, output)
	case "mp4":
		args = append(args, "-c:v", "libx264", "-f", "mp4", output)
	case "mkv":
		args = append(args, "-c:v", "libx264", "-f", "matroska", output)
	default:
		return fmt.Errorf("formato não suportado: %s", format)
	}

	cmd := exec.Command("ffmpeg", args...)
	return cmd.Run()
}

func updateStatus(id, status, output string) {
	update := bson.M{"status": status}
	if output != "" {
		update["output"] = output
	}
	_, err := tasksCol.UpdateOne(ctx, bson.M{"id": id}, bson.M{"$set": update})
	if err != nil {
		log.Printf("Erro ao atualizar status de %s: %s\n", id, err)
	}
}
