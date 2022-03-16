FROM node:latest

# Add app components
ADD . /var/scalargis

# Set working dir
WORKDIR /var/scalargis

RUN yarn && yarn build:all && yarn build
