FROM node:22-alpine AS build
WORKDIR /workspace/municipal
COPY municipal/package*.json ./
RUN npm ci
COPY shared /workspace/shared
COPY theme/colors.ts /workspace/theme/colors.ts
COPY municipal ./
RUN npm run build
FROM nginx:1.27-alpine
COPY municipal/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/municipal/dist /usr/share/nginx/html
EXPOSE 80
