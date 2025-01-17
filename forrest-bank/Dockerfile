FROM node:14
WORKDIR /usr/src/app
COPY package*.json ./
COPY public /app/public
RUN npm install
COPY . .
EXPOSE 3010
CMD ["node", "app.js"]
