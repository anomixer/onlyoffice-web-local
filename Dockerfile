ARG NODE_VERSION=22
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

# Enable Corepack and install pnpm
RUN corepack enable && \
    corepack prepare pnpm@10.28.0 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (upstream uses pnpm)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build (upstream vite.config.ts builds to 'html')
RUN pnpm run build

FROM joseluisq/static-web-server:latest
# Upstream builds to /app/html
COPY --from=builder /app/html /public