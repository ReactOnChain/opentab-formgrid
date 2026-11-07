FROM node:22-bookworm-slim AS builder
RUN npm install -g pnpm@8.15.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json packages/api/package.json
RUN pnpm install --frozen-lockfile --filter @formgrid/api
COPY packages/api packages/api
RUN pnpm --filter @formgrid/api exec prisma generate && pnpm --filter @formgrid/api run build

FROM node:22-bookworm-slim
ENV NODE_ENV=production
RUN npm install -g pnpm@8.15.0
WORKDIR /app
COPY --from=builder /app /app
RUN mkdir -p /app/packages/api/uploads && chown -R node:node /app/packages/api/uploads
USER node
WORKDIR /app/packages/api
EXPOSE 4000
CMD ["node", "dist/server.js"]
