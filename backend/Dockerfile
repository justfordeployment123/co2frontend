FROM node:20-alpine
WORKDIR /app

# Install build dependencies for native modules (canvas, sharp, etc.
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    git \
    pkgconfig \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    libpng-dev \
    pixman-dev \
    bash

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5001
CMD ["npm", "start"]