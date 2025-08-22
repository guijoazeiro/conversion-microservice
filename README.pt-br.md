# Conversão de Arquivos em Microsserviços

[![Language](https://img.shields.io/badge/Language-English-blue)](#file-conversion-microservices)
[![Language](https://img.shields.io/badge/Language-Português-green)](README.pt-br.md)

Este projeto é uma implementação de um sistema de conversão de arquivos usando arquitetura de microsserviços com Go e Node.js. O sistema é composto por três microsserviços:

1. **conversion-worker**: responsável por realizar a conversão de arquivos de vídeo e áudio utilizando o FFmpeg.
2. **conversion-api**: responsável por gerenciar as requisições de conversão de arquivos e interagir com o microsserviço de conversão e armazenar metadados.
3. **outbox**: responsável pela implementação do padrão outbox usando Redis e PostgreSQL.

## Funcionalidades

- Conversão de arquivos de vídeo e áudio para diferentes formatos
- Gerenciamento de requisições de conversão de arquivos
- Integração com microsserviço de conversão
- API RESTful com documentação Swagger
- Processamento baseado em fila com Redis
- Armazenamento de metadados com PostgreSQL
- Implementação do padrão outbox para garantia de consistência

## Padrão Outbox

Este projeto implementa o **padrão outbox** para garantir que todos os arquivos enviados sejam processados de forma confiável, mesmo em cenários de falhas temporárias.

### Como Funciona
1. **Atomicidade**: Quando um arquivo é enviado, os dados são salvos na tabela `conversion_tasks` e um evento é criado na tabela `outbox_events` em uma única transação
2. **Processamento Assíncrono**: O `outbox-processor` monitora eventos pendentes e os envia para as filas Redis apropriadas
3. **Garantia de Entrega**: Se houver falhas temporárias (Redis fora do ar, problemas de rede), os eventos permanecem pendentes até serem processados com sucesso
4. **Sistema de Retry**: Eventos falhos são reprocessados automaticamente até um limite máximo de tentativas

### Benefícios
- **Zero perda de arquivos**: Todo upload é garantidamente processado
- **Resiliência a falhas**: Sistema se recupera automaticamente de problemas temporários
- **Observabilidade**: Histórico completo de eventos para auditoria e debugging
- **Extensibilidade**: Facilita adição de novos consumidores de eventos (webhooks, notificações, etc.)

## Tecnologias Utilizadas

- **Go (Golang)** para o microsserviço de conversão
- **Node.js** com TypeScript para o microsserviço de API
- **FFmpeg** para conversão de arquivos de vídeo e áudio
- **Redis** para fila de requisições de conversão
- **PostgreSQL** para armazenamento de metadados de arquivos

## Pré-requisitos

- Docker e Docker Compose instalados no sistema
- Git instalado no sistema

**OU** para instalação manual:
- Go (Golang) instalado no sistema
- Node.js instalado no sistema
- FFmpeg instalado no sistema
- Redis instalado e executando no sistema
- PostgreSQL instalado e executando no sistema

## Início Rápido com Docker (Recomendado)

### 1. Clonar o Repositório
```bash
git clone https://github.com/guijoazeiro/conversion-microservice.git
cd conversion-microservices
```

### 2. Executar com Docker Compose
```bash
# Iniciar todos os serviços (API, Worker, Redis, PostgreSQL)
docker-compose up -d

# Visualizar logs
docker-compose logs -f

# Parar todos os serviços
docker-compose down
```

### 3. Acessar a Aplicação
- **API**: http://localhost:3000
- **Documentação Swagger**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## Instalação e Configuração Manual

Se preferir executar sem Docker:

### 1. Clonar o Repositório
```bash
git clone https://github.com/guijoazeiro/conversion-microservice.git
cd conversion-microservices
```

### 2. Configurar o Worker de Conversão (Go)
```bash
cd conversion-worker
go mod download
go build
```

### 3. Configurar a API de Conversão (Node.js)
```bash
cd conversion-api
npm install
```

### 4. Configuração de Ambiente
"Crie arquivos `.env` para os três microsserviços com suas configurações necessárias."

**conversion-api/.env**
```env
PORT=3000
UPLOAD_DIR=../tmp/input
REDIS_URL=redis://localhost:6379
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=postgres123
PG_DATABASE=converter9
```

**conversion-worker/.env**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=postgres123
PG_DATABASE=conversion
```

**outbox-processor/.env**
```env
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=converter
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
REDIS_URL=redis://localhost:6379
PROCESSOR_INTERVAL=500
BATCH_SIZE=10
```

## Executando os Serviços

### Com Docker (Recomendado)
Todos os serviços já estão executando se você usou `docker compose up --build -d`.

### Configuração Manual

### Iniciar o Serviço da API
```bash
cd conversion-api
npm run dev
```

### Iniciar o Serviço Worker
```bash
cd conversion-worker
go run main.go
```

## Documentação da API

A documentação da API está disponível via Swagger UI em:
```
http://localhost:3000/api-docs
```

## Formatos Suportados

### Conversão de Vídeos
Os vídeos podem ser convertidos para os seguintes formatos:
- `mp3` (extração de áudio)
- `wav` (extração de áudio)
- `avi`
- `mp4`
- `mkv`
- `mov`
- `wmv`
- `flv`
- `gif`
- `images` (extração de frames)

### Conversão de Imagens
As imagens podem ser convertidas para os seguintes formatos:
- `jpg`
- `jpeg`
- `png`
- `webp`

### Conversão de Áudio
Os arquivos de áudio podem ser convertidos para os seguintes formatos:
- `mp3`
- `wav`
- `flac`
- `ogg`
- `wma`
- `aac`

## Uso da API

### Conversão de Arquivos
Envie uma requisição POST para o endpoint `/api/convert` com o arquivo a ser convertido e o formato de saída desejado.

#### Exemplo de Requisição
```bash
curl -X POST \
  http://localhost:3000/api/convert \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@video.mp4' \
  -F 'format=mp3'
```

#### Exemplo de Resposta
```json
{
  "id": "019899dc-e5f0-77ef-b0e9-424d281933f3",
  "original_name": "SampleVideo_1280x720_1mb.mp4",
  "stored_name": "f534874a-5783-48cc-8475-2d7d6a432962.mp4",
  "input_path": "/tmp/input/f534874a-5783-48cc-8475-2d7d6a432962.mp4",
  "mimetype": "video/mp4",
  "format": "mkv",
  "file_size": 1055736,
  "status": "pending",
  "createdAt": "2025-08-11T16:00:47.603Z",
  "updatedAt": "2025-08-11T16:00:47.603Z"
}
```

### Verificar Status da Conversão
```bash
curl -X GET http://localhost:3000/api/file/status/{id}
```

### Baixar Arquivo Convertido
```bash
curl -X GET http://localhost:3000/api/file/download/{id} -o arquivo-convertido.mp3
```

### Listar Arquivos
```bash
curl -X GET "http://localhost:3000/api/file?format=mp3&status=completed&page=1&limit=10"
```

## Estrutura do Projeto

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
│   |── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── go.mod
│   ├── go.sum
│   └── main.go
├── int-db/
│   ├── 01_init_tables.sql
│   └── 02_functions.sql
├── outbox-processor/
│   ├── src/
│   │   ├── config/
│   │   │   ├── environment.ts
│   │   │   ├── logger.ts
│   │   │   └── redis.ts
│   │   ├── database/
│   │   │   └── postgres.ts
│   │   ├── queue/
│   │   │   └── redis.ts
│   │   ├── index.ts
│   └── env.example
│   
├── .gitignore
├── docker-compose.yml
├── README.md
└── README.pt-br.md
```

## Health Check

Verificar se a API está executando:
```bash
curl -X GET http://localhost:3000/health
```

## Contribuição

Contribuições são bem-vindas! Se você tiver sugestões ou correções, por favor, abra uma issue ou envie um pull request.

### Diretrizes de Desenvolvimento
1. Faça um fork do repositório
2. Crie uma branch para a funcionalidade (`git checkout -b feature/funcionalidade-incrivel`)
3. Faça commit das suas mudanças (`git commit -m 'Adiciona funcionalidade incrível'`)
4. Faça push para a branch (`git push origin feature/funcionalidade-incrivel`)
5. Abra um Pull Request

## Licença

Este projeto é licenciado sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Suporte

Se você encontrar algum problema ou tiver dúvidas, por favor, abra uma issue no GitHub.