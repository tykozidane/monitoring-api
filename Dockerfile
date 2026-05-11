# backend/Dockerfile
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
ENV HOSTNAME "0.0.0.0"
ENV PORT 4000
EXPOSE 4000



CMD ["node", "index.js"]
