package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Redis    RedisConfig
	Database DatabaseConfig
	Worker   WorkerConfig
	App      AppConfig
}

type RedisConfig struct {
	Host string
	Port string
	Addr string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Database string
	DSN      string
}
type WorkerConfig struct {
	LightWorkers int
	HeavyWorkers int
	Type         string
}

type AppConfig struct {
	Environment string
	LogLevel    string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	config := &Config{
		Redis: RedisConfig{
			Host: getEnvOrDefault("REDIS_HOST", "localhost"),
			Port: getEnvOrDefault("REDIS_PORT", "6379"),
		},
		Database: DatabaseConfig{
			Host:     getEnvOrDefault("POSTGRES_HOST", "localhost"),
			Port:     getEnvOrDefault("POSTGRES_PORT", "5432"),
			User:     getEnvOrDefault("POSTGRES_USER", "postgres"),
			Password: getEnvOrDefault("POSTGRES_PASSWORD", ""),
			Database: getEnvOrDefault("POSTGRES_DB", "conversion"),
		},
		Worker: WorkerConfig{
			LightWorkers: getEnvInt("LIGHT_WORKERS", 2),
			HeavyWorkers: getEnvInt("HEAVY_WORKERS", 1),
			Type:         getEnvOrDefault("WORKER_TYPE", ""),
		},
		App: AppConfig{
			Environment: getEnvOrDefault("ENVIRONMENT", "development"),
			LogLevel:    getEnvOrDefault("LOG_LEVEL", "info"),
		},
	}
	config.Redis.Addr = fmt.Sprintf("%s:%s", config.Redis.Host, config.Redis.Port)
	config.Database.DSN = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		config.Database.User,
		config.Database.Password,
		config.Database.Host,
		config.Database.Port,
		config.Database.Database)

	return config, config.validate()

}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func (c *Config) validate() error {
	if c.Database.User == "" {
		return fmt.Errorf("POSTGRES_USER is required")
	}
	if c.Database.Password == "" {
		return fmt.Errorf("POSTGRES_PASSWORD is required")
	}
	if c.Database.Database == "" {
		return fmt.Errorf("POSTGRES_DB is required")
	}
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
