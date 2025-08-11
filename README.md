# File Conversion Microservices

[![Language](https://img.shields.io/badge/Language-English-blue)](#file-conversion-microservices)
[![Language](https://img.shields.io/badge/Language-Português-green)](README.pt-br.md)

This project is a file conversion system implementation using microservices architecture with Go and Node.js. The system consists of two microservices:

1. **conversion-worker**: responsible for performing video and audio file conversion using FFmpeg.
2. **conversion-api**: responsible for managing file conversion requests and interacting with the conversion microservice.

## Features

- Video and audio file conversion to different formats
- File conversion request management
- Integration with conversion microservice
- RESTful API with Swagger documentation
- Queue-based processing with Redis
- Metadata storage with MongoDB

## Technologies Used

- **Go (Golang)** for the conversion microservice
- **Node.js** with TypeScript for the API microservice
- **FFmpeg** for video and audio file conversion
- **Redis** for conversion request queuing
- **MongoDB** for file metadata storage

## Prerequisites

- Docker and Docker Compose installed on the system
- Git installed on the system

**OR** for manual installation:
- Go (Golang) installed on the system
- Node.js installed on the system
- FFmpeg installed on the system
- Redis installed and running on the system
- MongoDB installed and running on the system

## Quick Start with Docker (Recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/guijoazeiro/conversion-microservice.git
cd conversion-microservices
```

### 2. Run with Docker Compose
```bash
# Start all services (API, Worker, Redis, MongoDB)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 3. Access the Application
- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## Manual Installation and Setup

If you prefer to run without Docker:

### 1. Clone the Repository
```bash
git clone https://github.com/guijoazeiro/conversion-microservice.git
cd conversion-microservices
```

### 2. Setup Conversion Worker (Go)
```bash
cd conversion-worker
go mod download
go build
```

### 3. Setup Conversion API (Node.js)
```bash
cd conversion-api
npm install
```

### 4. Environment Configuration
Create `.env` files in both microservices with the necessary configurations:

**conversion-api/.env**
```env
PORT=3000
UPLOAD_DIR=../tmp/input
MONGO_URI=mongodb://mongo:27017/converter
REDIS_URL=redis://localhost:6379
```

**conversion-worker/.env**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
MONGO_URI=mongodb://localhost:27017/converter
```

## Running the Services

### With Docker (Recommended)
All services are already running if you used `docker compose up --build -d`.

### Manual Setup

### Start the API Service
```bash
cd conversion-api
npm run dev
```

### Start the Worker Service
```bash
cd conversion-worker
go run main.go
```

## API Documentation

The API documentation is available via Swagger UI at:
```
http://localhost:3000/api-docs
```

## Supported Formats

### Video Conversion
Videos can be converted to the following formats:
- `mp3` (audio extraction)
- `wav` (audio extraction)
- `avi`
- `mp4`
- `mkv`
- `mov`
- `wmv`
- `flv`
- `gif`
- `images` (frame extraction)

### Image Conversion
Images can be converted to the following formats:
- `jpg`
- `jpeg`
- `png`
- `webp`

### Audio Conversion
Audio files can be converted to the following formats:
- `mp3`
- `wav`
- `flac`
- `ogg`
- `wma`
- `aac`

## API Usage

### File Conversion
Send a POST request to the `/api/convert` endpoint with the file to be converted and the desired output format.

#### Example Request
```bash
curl -X POST \
  http://localhost:3000/api/convert \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@video.mp4' \
  -F 'format=mp3'
```

#### Example Response
```json
{
  "id": "019899dc-e5f0-77ef-b0e9-424d281933f3",
  "originalName": "video.mp4",
  "storedName": "f534874a-5783-48cc-8475-2d7d6a432962.mp4",
  "mimetype": "video/mp4",
  "path": "/tmp/input/f534874a-5783-48cc-8475-2d7d6a432962.mp4",
  "format": "mp3",
  "status": "pending",
  "createdAt": "2025-08-11T16:00:47.603Z",
  "updatedAt": "2025-08-11T16:00:47.603Z"
}
```

### Check Conversion Status
```bash
curl -X GET http://localhost:3000/api/file/status/{id}
```

### Download Converted File
```bash
curl -X GET http://localhost:3000/api/file/download/{id} -o converted-file.mp3
```

### List Files
```bash
curl -X GET "http://localhost:3000/api/file?format=mp3&status=completed&page=1&limit=10"
```

## Project Structure

```
file-conversion-microservices/
├── conversion-api/
│   ├── docs/
│   │   └── swagger.yaml
│   ├── node_modules/
│   ├── src/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── database/
│   │   ├── errors/
│   │   ├── jobs/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── service/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── .gitignore
│   ├── .prettierrc
│   ├── Dockerfile
│   ├── package-lock.json
│   ├── package.json
│   └── tsconfig.json
├── conversion-worker/
│   ├── converter/
│   │   ├── audio.go
│   │   ├── converter.go
│   │   ├── image.go
│   │   └── video.go
│   ├── database/
│   │   ├── database.go
│   │   └── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── go.mod
│   ├── go.sum
│   └── main.go
├── .gitignore
├── docker-compose.yml
├── README.md
└── README.pt-br.md
```

## Health Check

Check if the API is running:
```bash
curl -X GET http://localhost:3000/health
```

## Contributing

Contributions are welcome! If you have suggestions or corrections, please open an issue or submit a pull request.

### Development Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
