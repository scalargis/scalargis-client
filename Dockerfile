# Build phase
FROM node:16.10.0 as build

# Instal base packages
WORKDIR /var/scalargis
COPY package.json .
COPY yarn.lock .
COPY ./packages/backoffice/package.json packages/backoffice/package.json
COPY ./packages/components/package.json packages/components/package.json
COPY ./packages/frontend/package.json packages/frontend/package.json
COPY ./packages/primereact-renderers/package.json packages/primereact-renderers/package.json
RUN yarn install

# Build app
ADD . /var/scalargis
RUN npm run build

# Deploy phase
FROM nginx:stable-alpine

COPY --from=build /var/scalargis//packages/frontend/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
