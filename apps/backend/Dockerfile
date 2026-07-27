# ---- Build stage ----
FROM golang:1.25-alpine AS build

# Needed for go mod download over HTTPS + some go tooling
RUN apk add --no-cache git ca-certificates

WORKDIR /app

# Copy go mod files first for better layer caching
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source
COPY . .

# Build a static binary
# CGO_ENABLED=0 -> no libc dependency, works on scratch/distroless
# -trimpath removes local file paths from the binary (reproducibility + smaller)
# -ldflags="-s -w" strips debug info
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" -o /app/main .

# ---- Final stage ----
FROM alpine:latest AS release

RUN apk add --no-cache dumb-init ca-certificates && \
    addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY --from=build /app/main .

USER app

EXPOSE 3000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["./main"]
