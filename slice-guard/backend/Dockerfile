# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY backend/package.json /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY backend/package.json /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
# Create directory for the shared contents
COPY --from=install /temp/dev/node_modules node_modules
COPY backend/ ./backend
COPY shared/ ./shared/

# [optional] tests & build
ENV NODE_ENV=production
# RUN bun test
# RUN bun run build


# copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules ./backend/node_modules
COPY --from=prerelease /usr/src/app/shared ./shared
COPY --from=prerelease /usr/src/app/backend/ ./backend/
COPY --from=prerelease /usr/src/app/backend/package.json ./backend


# run the app
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "backend/src/server.ts" ]