FROM node:20-slim

RUN apt-get update && apt-get install -y \
    make \
    git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

USER node
