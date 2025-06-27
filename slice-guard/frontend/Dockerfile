# Stage 1: install dependencies
FROM oven/bun:1 AS deps
WORKDIR /usr/src/app
COPY frontend/package.json ./package.json
RUN bun install --frozen-lockfile

# Stage 2: build frontend
FROM oven/bun:1 AS build
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY frontend/ .
COPY shared/ ./shared
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
RUN bun run build

# Stage 3: production image
FROM oven/bun:1 AS release
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY frontend/package.json ./package.json
USER bun
EXPOSE 5173
ENTRYPOINT ["bun", "run", "serve"]
