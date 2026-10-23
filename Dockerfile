FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node index.js deployCommands.js database.js healthCheck.js ./
COPY --chown=node:node commands ./commands
RUN mkdir -p /app/data && chown node:node /app/data

USER node
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:8000', { signal: AbortSignal.timeout(8000) }).then(async response => { process.exitCode = response.ok && await response.text() === 'healthy' ? 0 : 1; }).catch(() => { process.exitCode = 1; });"]
CMD ["node", "index.js"]
