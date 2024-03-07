FROM node:21.6.1-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD [ "electron", "." ]
