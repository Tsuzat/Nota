# Use the official lightweight Bun image
FROM oven/bun:1-slim AS base
WORKDIR /usr/src/app

# ---------------------------------------------------------
# Stage 1: Install dependencies
# ---------------------------------------------------------
FROM base AS install

# Install all dependencies into a temp directory
# This will cache them and speed up future builds
RUN mkdir -p /temp/dev
COPY package.json /temp/dev/
RUN cd /temp/dev && bun install --ignore-scripts

# Install production dependencies only in another temp directory
RUN mkdir -p /temp/prod
COPY package.json /temp/prod/
RUN cd /temp/prod && bun install --production --ignore-scripts

# ---------------------------------------------------------
# Stage 2: Release
# ---------------------------------------------------------
FROM base AS release

# Copy production dependencies
COPY --from=install /temp/prod/node_modules ./node_modules

# Copy application source code
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Run the app as a non-root user for security
USER bun

# Expose the default port (Railway will override this via the PORT env variable)
EXPOSE 1234/tcp

# Start the application using Bun
ENTRYPOINT ["bun", "run", "src/main.ts"]
