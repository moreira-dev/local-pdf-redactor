FROM node:24-slim AS build
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

RUN corepack enable pnpm
RUN corepack use pnpm@latest-12
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build


FROM caddy:2.11-alpine

# We don't need access to privileged ports
RUN setcap -r /usr/bin/caddy

COPY .docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/build /srv

USER 1000:1000

EXPOSE 8080
