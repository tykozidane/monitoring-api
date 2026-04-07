# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY /app/storage ./storage
COPY /app/log-loki ./log-loki
RUN npm install --production

COPY . .

EXPOSE 4000

ENV HOSTNAME "0.0.0.0"
ENV PORT 4000

CMD ["node", "index.js"]
