# Build phase
FROM node:14.17.1 as build

# Instal base packages
WORKDIR /var/scalargis
COPY package.json .
COPY yarn.lock .
RUN yarn install

# Build app
ADD . /var/scalargis
RUN yarn build:all

# Deploy phase
FROM nginx:stable-alpine

COPY --from=build /var/scalargis/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
