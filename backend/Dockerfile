FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to Javascript
RUN npm run build

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist/app.js"]
