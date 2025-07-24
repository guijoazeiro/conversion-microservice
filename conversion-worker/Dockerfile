FROM golang:1.22.2-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go build -o worker main.go

FROM alpine:latest

RUN apk --no-cache add \
    ca-certificates \
    ffmpeg \
    && rm -rf /var/cache/apk/*

WORKDIR /root/

COPY --from=builder /app/worker .

RUN mkdir -p /tmp/input /tmp/output

CMD ["./worker"]