FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

COPY . .

RUN mkdir -p /tmp/input /tmp/output

EXPOSE 3000

CMD ["npm", "run", "dev"]