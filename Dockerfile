FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production

FROM node:18-alpine
WORKDIR /usr/src/app
RUN apk add --no-cache postgresql-client
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .
RUN mkdir -p logs
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
CMD ["npm", "start"]
