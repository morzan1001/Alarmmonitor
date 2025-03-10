FROM harbor.runforest.run/library/node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS build

ARG WEBSOCKET_URL
ENV VITE_WEBSOCKET_URL=$WEBSOCKET_URL

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM harbor.runforest.run/library/nginx:alpine
LABEL authors="Matthias Duve"

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

HEALTHCHECK --interval=5s --timeout=3s CMD wget -O /dev/null http://localhost || exit 1