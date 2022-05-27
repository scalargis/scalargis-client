# Build phase
FROM node:latest as build

# Instal base packages
WORKDIR /var/scalargis
COPY package.json .
COPY yarn.lock .
COPY ./packages/backoffice/package.json packages/backoffice/package.json
COPY ./packages/components/package.json packages/components/package.json
COPY ./packages/frontend/package.json packages/frontend/package.json
COPY ./packages/primereact-renderers/package.json packages/primereact-renderers/package.json
RUN yarn

# Build app
ADD . /var/scalargis
RUN yarn build:all

# Build frontend
RUN yarn build

# Deploy phase
FROM nginx:stable-alpine

COPY --from=build /var/scalargis/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
