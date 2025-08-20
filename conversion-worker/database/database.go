package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

type Database struct {
	db  *sql.DB
	ctx context.Context
}

func New(_ interface{}) *Database {
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		os.Getenv("POSTGRES_USER"),
		os.Getenv("POSTGRES_PASSWORD"),
		os.Getenv("POSTGRES_HOST"),
		os.Getenv("POSTGRES_PORT"),
		os.Getenv("POSTGRES_DB"))

	conn, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Erro ao conectar ao PostgreSQL: %v", err)
	}
	if err := conn.Ping(); err != nil {
		log.Fatalf("Erro ao pingar PostgreSQL: %v", err)
	}
	log.Println("Conectado ao PostgreSQL")
	return &Database{
		db:  conn,
		ctx: context.Background(),
	}
}

func (d *Database) UpdateStatus(id, status, output, filename string) {
	var outputParam sql.NullString
	if output != "" {
		outputParam = sql.NullString{String: output, Valid: true}
	} else {
		outputParam = sql.NullString{Valid: false}
	}

	_, err := d.db.ExecContext(
		d.ctx,
		"SELECT public.update_task_status_with_outbox($1::uuid, $2::varchar, $3::text)",
		id, status, outputParam,
	)
	if err != nil {
		log.Printf("Erro ao atualizar status para task %s: %v", id, err)
	}
}
