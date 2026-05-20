FROM node:24-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl unzip \
  && rm -rf /var/lib/apt/lists/*

ENV DENO_INSTALL=/usr/local/deno
ENV PATH="${DENO_INSTALL}/bin:${PATH}"

RUN curl -fsSL https://github.com/denoland/deno/releases/download/v2.2.5/deno-x86_64-unknown-linux-gnu.zip \
  -o /tmp/deno.zip \
  && unzip /tmp/deno.zip -d /usr/local/bin \
  && chmod +x /usr/local/bin/deno \
  && rm /tmp/deno.zip

RUN corepack enable && corepack prepare pnpm@10.16.1 --activate

WORKDIR /workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json ./
COPY packages ./packages
COPY docker/scripts ./docker/scripts

RUN pnpm install --frozen-lockfile || pnpm install
