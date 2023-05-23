FROM --platform=linux/arm64 node:18-alpine3.17
WORKDIR /app

ADD dist ./dist
ADD src ./src
COPY package.json .
COPY babel.config.js .
COPY webpack.config.js .
ENV NODE_ENV=production
ENV DEFAULT_EGG_IMAGE_URL=https://topiaimages.s3.us-west-1.amazonaws.com/arva_egg.png
ENV API_URL=http://localhost:3001

EXPOSE 3000
RUN apk add --update --no-cache make gcc g++ python3 && ln -sf python3 /usr/bin/python
RUN npm install
RUN npm run build
CMD ["npm", "start"]