FROM node:22-alpine
WORKDIR /app
COPY back/package*.json ./back/
RUN npm ci --prefix back
COPY back/src ./back/src
COPY back/test ./back/test
COPY back/migrations ./back/migrations
COPY back/data ./back/data
COPY back/tsconfig.json ./back/tsconfig.json
COPY shared ./shared
WORKDIR /app/back
ENV PORT=3001 UPLOAD_DIR=/app/uploads
RUN npm run build
RUN mkdir -p /app/uploads && chown -R node:node /app
USER node
EXPOSE 3001
CMD ["sh", "-c", "node dist/back/src/migrate.js && node dist/back/src/server.js"]
