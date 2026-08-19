FROM golang:1.24-bookworm AS go-build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY cmd ./cmd
COPY internal ./internal
RUN CGO_ENABLED=0 go build -o /out/api ./cmd/api

FROM node:22-bookworm-slim AS node-build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npx vite build --config spa/vite.config.ts

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV LISTEN_HOST=0.0.0.0
ENV DB_PATH=/data/data.db
ENV REPO_ROOT=/app
RUN mkdir -p /data/cache/pptx /app/data/uploads
COPY --from=go-build /out/api ./api
COPY --from=node-build /app/spa/dist ./spa/dist
COPY --from=node-build /app/public ./public
COPY --from=node-build /app/workers ./workers
COPY --from=node-build /app/src ./src
COPY --from=node-build /app/data ./data
COPY --from=node-build /app/node_modules ./node_modules
COPY --from=node-build /app/package.json ./package.json
EXPOSE 3000
CMD ["./api"]
