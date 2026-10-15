FROM node:24-alpine AS pruner

WORKDIR /app

RUN yarn global add turbo

COPY . .

RUN turbo prune api-gateway --docker


FROM node:24-alpine AS builder

WORKDIR /app

COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/yarn.lock ./yarn.lock

RUN yarn install --frozen-lockfile

COPY --from=pruner /app/out/full/ ./

RUN yarn turbo run build --filter=api-gateway...


FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app ./

CMD ["node", "apps/api-gateway/dist/main.js"]