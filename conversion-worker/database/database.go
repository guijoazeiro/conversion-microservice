package database

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type Database struct {
	tasksCol *mongo.Collection
	ctx      context.Context
}

func New(client *mongo.Client) *Database {
	return &Database{
		tasksCol: client.Database("converter").Collection("tasks"),
		ctx:      context.Background(),
	}
}

func (db *Database) UpdateStatus(id, status, output string) {
	update := bson.M{"status": status}
	if output != "" {
		update["output"] = output
	}
	_, err := db.tasksCol.UpdateOne(db.ctx, bson.M{"id": id}, bson.M{"$set": update})
	if err != nil {
		log.Printf("Erro ao atualizar status de %s: %v\n", id, err)
	}
}
