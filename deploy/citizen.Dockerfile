FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV EXPO_PUBLIC_API_URL=/api EXPO_NO_TELEMETRY=1
RUN npx expo export --platform web --output-dir web-dist --max-workers 2

FROM nginx:stable-alpine
COPY deploy/citizen.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web-dist /usr/share/nginx/html
EXPOSE 80
