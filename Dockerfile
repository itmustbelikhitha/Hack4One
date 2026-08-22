FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm install
COPY . .

FROM base AS api
WORKDIR /app/apps/api
RUN npm run build
CMD ["npm", "run", "start"]

FROM base AS web
WORKDIR /app/apps/web
RUN npm run build
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
