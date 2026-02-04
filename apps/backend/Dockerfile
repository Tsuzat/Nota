FROM golang:1.25 AS builder

LABEL maintainer="Alok Singh <contact@tsuzat.com> (https://tsuzat.com)"

ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64

# Move to working directory (/build).
WORKDIR /build

# Copy and download dependency using go mod.
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy the code into the container.
COPY . .

RUN go build -ldflags="-s -w" -o main .

FROM scratch

EXPOSE 8080

# Copy binary and config files from /build to root folder of scratch container.
COPY --from=builder ["/build/main", "/"]

# Command to run when starting the container.
ENTRYPOINT ["/main"]