# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
# install dependencies
FROM base AS deps
COPY bun.lock ./bun.lock
COPY backend/package.json ./backend/package.json
RUN bun install --cwd ./backend --frozen-lockfile

# development image
FROM base AS dev
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend
COPY shared/ ./shared
USER bun
EXPOSE 3000
CMD ["bun", "run", "--cwd", "./backend", "dev"]

# build binary
FROM base AS build
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend
COPY shared/ ./shared
RUN bun run build --cwd ./backend

# production image
FROM base AS release
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/backend/dist/server ./server
COPY shared/ ./shared
USER bun
EXPOSE 3000
ENTRYPOINT ["./server"]
