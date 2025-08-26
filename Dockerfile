

FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=9000 \
    ADMIN_USER=admin \
    ADMIN_PASS=

RUN mkdir -p /app/data
RUN chown -R node:node /app

VOLUME ["/app/data"]

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

USER node

EXPOSE 9000

CMD ["npm", "start"]


# docker build -t raffle_webapp .
# docker run -p 9000:9000 raffle_webapp