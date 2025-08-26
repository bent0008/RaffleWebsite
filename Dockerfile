

FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Environment var
ENV PORT=9000

# Expose port
EXPOSE 9000

# Run it
CMD ["npm", "start"]


# docker build -t raffle_webapp .
# docker run -p 9000:9000 raffle_webapp