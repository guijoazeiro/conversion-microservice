package logger

import (
	"log"
	"os"
	"strings"
)

type LogLevel int

const (
	DEBUG LogLevel = iota
	INFO
	WARN
	ERROR
)

type Logger struct {
	level LogLevel
}

var globalLogger *Logger

func init() {
	level := getLogLevelFromEnv()
	globalLogger = &Logger{level: level}
}

func getLogLevelFromEnv() LogLevel {
	levelStr := strings.ToUpper(os.Getenv("LOG_LEVEL"))
	switch levelStr {
	case "DEBUG":
		return DEBUG
	case "INFO":
		return INFO
	case "WARN", "WARNING":
		return WARN
	case "ERROR":
		return ERROR
	default:
		return INFO
	}
}

func Debug(format string, args ...interface{}) {
	if globalLogger.level <= DEBUG {
		log.Printf("[DEBUG] "+format, args...)
	}
}

func Info(format string, args ...interface{}) {
	if globalLogger.level <= INFO {
		log.Printf("[INFO] "+format, args...)
	}
}

func Warn(format string, args ...interface{}) {
	if globalLogger.level <= WARN {
		log.Printf("[WARN] "+format, args...)
	}
}

func Error(format string, args ...interface{}) {
	if globalLogger.level <= ERROR {
		log.Printf("[ERROR] "+format, args...)
	}
}

func SetLevel(level LogLevel) {
	globalLogger.level = level
}
