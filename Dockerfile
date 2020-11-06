FROM node:12

WORKDIR /usr/src/app

COPY ./serve/package*.json ./

RUN npm install

COPY ./serve/ .

EXPOSE 9080
CMD [ "node", "./bin/www" ]