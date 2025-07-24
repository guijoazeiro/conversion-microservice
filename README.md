# Conversão de Arquivos em Microsserviços

Este projeto é uma implementação de um sistema de conversão de arquivos em microsserviços, utilizando Go e Node.js. O sistema é composto por dois microsserviços:

1.  **conversion-worker**: responsável por realizar a conversão de arquivos de vídeo e áudio, utilizando o FFmpeg.
2.  **conversion-api**: responsável por gerenciar as requisições de conversão de arquivos e interagir com o microsserviço de conversão.

## Funcionalidades

*   Conversão de arquivos de vídeo e áudio em diferentes formatos.
*   Gerenciamento de requisições de conversão de arquivos.
*   Integração com o microsserviço de conversão.

## Tecnologias Utilizadas

*   Go (Golang) para o microsserviço de conversão.
*   Node.js para o microsserviço de API.
*   FFmpeg para a conversão de arquivos de vídeo e áudio.
*   Redis para a fila de requisições de conversão.
*   MongoDB para armazenamento de metadados de arquivos.

## Instalação e Execução

### Pré-requisitos

*   Go (Golang) instalado no sistema.
*   Node.js instalado no sistema.
*   FFmpeg instalado no sistema.
*   Redis instalado e executando no sistema.
*   MongoDB instalado e executando no sistema.

### Passos para Instalação e Execução

1.  Clone o repositório do projeto.
2.  Acesse o diretório do microsserviço de conversão (`conversion-worker`) e execute o comando `go build` para compilar o código.
3.  Acesse o diretório do microsserviço de API (`conversion-api`) e execute o comando `npm install` para instalar as dependências.
4.  Execute o comando `npm start` para iniciar o microsserviço de API.
5.  Execute o comando `go run main.go` para iniciar o microsserviço de conversão.
# Conversão de Arquivos

## Conversão de Vídeos

Os vídeos podem ser convertidos para os seguintes formatos:

* `mp3`
* `wav`
* `avi`
* `mp4`
* `mkv`
* `mov`
* `wmv`
* `flv`
* `gif`
* `images`

## Conversão de Imagens

As imagens podem ser convertidas para os seguintes formatos:

* `jpg`
* `jpeg`
* `png`
* `webp`

## Conversão de Áudio

Os arquivos de áudio podem ser convertidos para os seguintes formatos:

* `mp3`
* `wav`
* `flac`
* `ogg`
* `wma`
* `aac`

## Uso

### Requisições de Conversão

*   Para realizar uma requisição de conversão, envie uma requisição POST para o endpoint `/convert` com o arquivo a ser convertido e o formato de saída desejado.
*   O microsserviço de API irá gerenciar a requisição e interagir com o microsserviço de conversão para realizar a conversão do arquivo.

### Exemplo de Requisição

```bash
curl -X POST \
  http://localhost:3000/convert \
  -H 'Content-Type: application/json' \
  -d '{"file": "arquivo.mp4", "format": "mp3"}'
```

## Contribuição

Contribuições são bem-vindas! Se você tiver alguma sugestão ou correção, por favor, abra uma issue ou envie um pull request.

## Licença

Este projeto é licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.