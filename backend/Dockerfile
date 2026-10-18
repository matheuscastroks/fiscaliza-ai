FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN npm ci --prefix backend
COPY backend/src ./backend/src
COPY backend/test ./backend/test
COPY backend/migrations ./backend/migrations
COPY backend/data ./backend/data
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY shared ./shared
WORKDIR /app/backend
ENV PORT=3001 UPLOAD_DIR=/app/uploads
RUN npm run build
RUN mkdir -p /app/uploads && chown -R node:node /app
USER node
EXPOSE 3001
CMD ["sh", "-c", "node dist/backend/src/migrate.js && node dist/backend/src/seed.js && node dist/backend/src/server.js"]
