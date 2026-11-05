FROM node:24-alpine AS build
WORKDIR /app/front
COPY front/package.json front/package-lock.json ./
RUN npm ci
COPY front .
COPY shared /app/shared
ENV EXPO_PUBLIC_API_URL=/api EXPO_NO_TELEMETRY=1
RUN npx expo export --platform web --output-dir web-dist --max-workers 2

FROM nginx:stable-alpine
COPY deploy/citizen.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/front/web-dist /usr/share/nginx/html
EXPOSE 80
