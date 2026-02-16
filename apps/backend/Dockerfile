# Building the binary of the App
FROM golang:1.25-alpine AS build

# Set working directory
WORKDIR /app

# Copy go mod and sum files for better layer caching
COPY go.mod go.sum ./

# Download all dependencies
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the application as a statically linked binary
# -ldflags="-s -w" removes debug information to reduce binary size
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-s -w" -o main .


# Moving the binary to the 'final Image' to make it smaller
FROM alpine:latest AS release

# Set working directory
WORKDIR /app

# Add packages:
# - dumb-init: for proper signal handling (PID 1)
# - ca-certificates: required for making HTTPS requests (OAuth, R2, etc.)
RUN apk add --no-cache dumb-init ca-certificates

# Copy the binary from the build stage
COPY --from=build /app/main .

# Expose the port the app listens on
EXPOSE 3000

# Use dumb-init to ensure signals are handled correctly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run the application
CMD ["./main"]
