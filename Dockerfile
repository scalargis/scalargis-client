# Build phase
FROM node:18.0 as build

# Instal base packages
WORKDIR /var/scalargis
COPY package.json .
COPY ./packages/jsonforms-primereact-renderers/package.json packages/jsonforms-primereact-renderers/package.json
COPY ./packages/components/package.json packages/components/package.json
COPY ./packages/backoffice/package.json packages/backoffice/package.json
COPY ./packages/viewer/package.json packages/viewer/package.json
RUN yarn install

# Build app
ADD . /var/scalargis
RUN yarn deploy:all

# Deploy phase
FROM registry.wkt.pt:5000/wkt/scalargis-server:latest

COPY --from=build /var/scalargis/build/viewer /var/scalargis/scalargis/app/static/
COPY --from=build /var/scalargis/build/backoffice /var/scalargis/scalargis/app/static/

