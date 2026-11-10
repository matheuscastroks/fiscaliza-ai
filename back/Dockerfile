# syntax=docker/dockerfile:1
# Base fixada por digest (node 22 alpine). Atualize junto com o Dependabot.
FROM node:22-alpine@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202 AS build
WORKDIR /app
COPY back/package*.json ./back/
RUN npm ci --prefix back
COPY back/tsconfig.json ./back/tsconfig.json
COPY back/src ./back/src
COPY back/test ./back/test
COPY shared ./shared
WORKDIR /app/back
RUN npm run build

FROM node:22-alpine@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202 AS runtime
ENV NODE_ENV=production PORT=3001 UPLOAD_DIR=/app/uploads
WORKDIR /app/back
COPY back/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
# Só o código compilado da API e do contrato compartilhado: sem testes nem fontes.
COPY --from=build /app/back/dist/back/src ./dist/back/src
COPY --from=build /app/back/dist/shared ./dist/shared
COPY back/migrations ./migrations
COPY back/data ./data
RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
# Node é o processo principal (recebe SIGTERM). As migrações rodam no serviço `migrate`.
CMD ["node", "dist/back/src/server.js"]
