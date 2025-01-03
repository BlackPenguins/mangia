FROM node:18

WORKDIR /app

COPY package*.json .npmrc ./

RUN npm uninstall @blackpenguins/penguinore-common-ext

RUN npm install @blackpenguins/penguinore-common-ext

RUN npm install

# Install dependencies
# RUN npm ci

# Copy the rest of the application code
COPY ./src ./src
COPY ./public ./public

CMD ["npm", "start"]