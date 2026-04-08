FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# Bind host to 0.0.0.0 so Vite can be accessed outside the Docker container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
