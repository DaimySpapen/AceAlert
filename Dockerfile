FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node index.js deployCommands.js database.js ./
COPY --chown=node:node commands ./commands
RUN mkdir -p /app/data && chown node:node /app/data

USER node
CMD ["node", "index.js"]
