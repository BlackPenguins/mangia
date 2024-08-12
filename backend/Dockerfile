FROM node:18

WORKDIR /app

RUN rm -rf node_modules
RUN npm install nodemon -g

COPY package.json .
RUN npm install
COPY . .

CMD ["npm", "start"]