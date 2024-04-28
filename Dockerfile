FROM node:18
WORKDIR /app
COPY . .
RUN yarn install
EXPOSE 3000
ENTRYPOINT ["/bin/bash","./docker-entrypoint.sh"]
